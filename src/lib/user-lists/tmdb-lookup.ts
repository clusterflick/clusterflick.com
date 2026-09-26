import {
  MATCH_BATCH_SIZE,
  matchTmdb,
  TmdbSearchError,
  type TmdbSearchResult,
} from "@/lib/tmdb-search";
import type { LetterboxdRow } from "./letterboxd-csv";

/**
 * The Worker's per-reader limit on match batches. Starting one every
 * 60s / 13 keeps an import just inside it.
 */
const BATCHES_PER_MINUTE = 13;
export const BATCH_INTERVAL_MS = Math.ceil(60_000 / BATCHES_PER_MINUTE);

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
  // The first batch starts straight away; each after waits its turn.
  const waits = Math.ceil(count / MATCH_BATCH_SIZE) - 1;
  return Math.max(1, Math.ceil((waits * BATCH_INTERVAL_MS) / 60_000));
}

/**
 * Looks each row up on TheMovieDB, a batch at a time, paced to the Worker's
 * rate limit. Rows TMDB has no match for are `missing`. A batch that can't be
 * looked up at all — after waiting out a rate limit, and a couple of retries
 * for anything else — throws, rather than counting its films as missing: the
 * reader would lose them from the import without knowing.
 */
export async function lookUpRowsOnTmdb(
  rows: LetterboxdRow[],
  {
    getIdToken,
    signal,
    onProgress,
    sleep: wait = sleep,
    now = Date.now,
  }: TmdbLookupOptions,
): Promise<TmdbLookup> {
  const lookup: TmdbLookup = { found: [], missing: [] };
  let lastStart = -Infinity;

  for (let start = 0; start < rows.length; start += MATCH_BATCH_SIZE) {
    const batch = rows.slice(start, start + MATCH_BATCH_SIZE);
    const films = batch.map(({ title, year }) => ({
      title,
      ...(year !== undefined && { year }),
    }));

    let results: (TmdbSearchResult | null)[] | undefined;
    let retries = 0;
    while (!results) {
      const due = lastStart + BATCH_INTERVAL_MS - now();
      if (due > 0) await wait(due, signal);
      lastStart = now();
      try {
        results = await matchTmdb(films, getIdToken, signal);
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

    results.forEach((film, index) => {
      if (film) lookup.found.push({ row: batch[index], film });
      else lookup.missing.push(batch[index]);
    });
    onProgress?.(Math.min(start + MATCH_BATCH_SIZE, rows.length));
  }
  return lookup;
}
