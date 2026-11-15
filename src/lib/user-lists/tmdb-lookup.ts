import {
  DETAILS_BATCH_SIZE,
  MATCH_BATCH_SIZE,
  matchTmdb,
  TmdbSearchError,
  type TmdbSearchResult,
} from "@/lib/tmdb-search";
import {
  EMPTY_FILM_DETAILS,
  fetchFilmDetailsFromTmdb,
  type FilmDetailsData,
} from "./film-details";
import type { LetterboxdRow } from "./letterboxd-csv";

/**
 * The Worker's per-reader limit on match lookups, and separately on details
 * lookups, counted per film. Each batch is followed by a wait of this long
 * per film in it, which keeps an import, or a backfill, just inside it.
 */
const LOOKUPS_PER_MINUTE = 1200;
export const LOOKUP_INTERVAL_MS = 60_000 / LOOKUPS_PER_MINUTE;

/** The limit counts a minute; hitting it anyway means waiting that out. */
const RATE_LIMITED_WAIT_MS = 60_000;

/** Other failures are tried again a couple of times before giving up. */
const RETRY_WAIT_MS = 5_000;
const MAX_RETRIES = 2;

export type TmdbLookup = {
  found: { row: LetterboxdRow; film: TmdbSearchResult }[];
  missing: LetterboxdRow[];
};

export type TmdbLookupOptions = {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  signal?: AbortSignal;
  /** Called after each batch with how many rows have been looked up. */
  onProgress?: (done: number) => void;
  /** Injected by tests, so a paced import doesn't take minutes. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  now?: () => number;
};

/** A wait that ends early, rejecting, if the import is cancelled. */
function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/** Roughly how long looking up `count` rows takes, in whole minutes. */
export function estimateLookupMinutes(count: number) {
  // The first batch starts straight away; each after waits for the one
  // before it, so every film but the last batch's is waited for.
  const waited = Math.max(0, count - MATCH_BATCH_SIZE);
  return Math.max(1, Math.ceil((waited * LOOKUP_INTERVAL_MS) / 60_000));
}

export type BatchRunnerOptions = {
  signal?: AbortSignal;
  /** Injected by tests, so paced batches don't take minutes. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  now?: () => number;
};

/**
 * Runs calls to the Worker's batch endpoints one at a time, paced to its
 * per-reader limit: each call says how many films it looks up, and the next
 * starts once that many lookups' worth of time has passed. A rate limit is waited out, and anything else retried a
 * couple of times before the error is thrown: the caller decides what a batch
 * that couldn't be looked up means, which is never that its films are missing.
 */
export function createBatchRunner({
  signal,
  sleep: wait = sleep,
  now = Date.now,
}: BatchRunnerOptions = {}) {
  let lastStart = -Infinity;
  let lastLookups = 0;
  return async function runBatch<T>(
    lookups: number,
    call: () => Promise<T>,
  ): Promise<T> {
    let retries = 0;
    for (;;) {
      const due = lastStart + lastLookups * LOOKUP_INTERVAL_MS - now();
      if (due > 0) await wait(due, signal);
      lastStart = now();
      lastLookups = lookups;
      try {
        return await call();
      } catch (error) {
        if (signal?.aborted) throw error;
        if (
          error instanceof TmdbSearchError &&
          error.reason === "rate-limited"
        ) {
          await wait(RATE_LIMITED_WAIT_MS, signal);
        } else if (retries < MAX_RETRIES) {
          retries++;
          await wait(RETRY_WAIT_MS, signal);
        } else {
          throw error;
        }
      }
    }
  };
}

/**
 * Looks each row up on TheMovieDB, a batch at a time, paced to the Worker's
 * rate limit. Rows TMDB has no match for are `missing`. A batch that can't be
 * looked up at all — after waiting out a rate limit, and a couple of retries
 * for anything else — throws, rather than counting its films as missing: the
 * reader would lose them from the import without knowing.
 *
 * A row with an IMDb id is found by the id, exactly. The Worker doesn't fall
 * back to the title for an id TMDB doesn't know (that would be a second TMDB
 * call for a film charged one lookup), so those rows are asked about again, by title and year, once the
 * first pass is done. `onProgress` counts rows settled either way.
 */
export async function lookUpRowsOnTmdb(
  rows: LetterboxdRow[],
  { getIdToken, signal, onProgress, sleep, now }: TmdbLookupOptions,
): Promise<TmdbLookup> {
  const lookup: TmdbLookup = { found: [], missing: [] };
  const runBatch = createBatchRunner({ signal, sleep, now });
  let settled = 0;

  const pass = async (
    queue: LetterboxdRow[],
    byImdbId: boolean,
  ): Promise<LetterboxdRow[]> => {
    const retry: LetterboxdRow[] = [];
    for (let start = 0; start < queue.length; start += MATCH_BATCH_SIZE) {
      const batch = queue.slice(start, start + MATCH_BATCH_SIZE);
      const films = batch.map(({ title, year, imdbId }) => ({
        title,
        ...(year !== undefined && { year }),
        ...(byImdbId && imdbId && { imdbId }),
      }));

      const results = await runBatch(films.length, () =>
        matchTmdb(films, getIdToken, signal),
      );
      results.forEach((film, index) => {
        const row = batch[index];
        if (film) lookup.found.push({ row, film });
        else if (byImdbId && row.imdbId) retry.push(row);
        else lookup.missing.push(row);
        // A row left for the second pass is settled when that reaches it.
        if (film || !byImdbId || !row.imdbId) settled++;
      });
      onProgress?.(settled);
    }
    return retry;
  };

  const retry = await pass(rows, true);
  if (retry.length > 0) await pass(retry, false);
  return lookup;
}

/**
 * Each film's details from TheMovieDB, for films an import found there that
 * aren't showing, a batch at a time and paced as the lookup is. Throws if a
 * batch can't be looked up, or names a film TMDB can't describe: an import
 * adds every film with its details or none of them.
 */
export async function lookUpDetailsOnTmdb(
  ids: string[],
  { getIdToken, signal, onProgress, sleep, now }: TmdbLookupOptions,
): Promise<FilmDetailsData> {
  const details: FilmDetailsData = structuredClone(EMPTY_FILM_DETAILS);
  const runBatch = createBatchRunner({ signal, sleep, now });
  for (let start = 0; start < ids.length; start += DETAILS_BATCH_SIZE) {
    const batch = ids.slice(start, start + DETAILS_BATCH_SIZE);
    const found = await runBatch(batch.length, () =>
      fetchFilmDetailsFromTmdb(batch, getIdToken, signal),
    );
    Object.assign(details.films, found.films);
    Object.assign(details.people, found.people);
    onProgress?.(Math.min(start + DETAILS_BATCH_SIZE, ids.length));
  }
  return details;
}
