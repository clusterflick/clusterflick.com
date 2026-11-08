import type { Movie, Person } from "@/types";
import { DETAILS_BATCH_SIZE, fetchTmdbDetails } from "@/lib/tmdb-search";
import {
  collectFilmDetails,
  fromTmdbDetails,
  getStalePeople,
  planFilmDetailsSync,
  type FilmDetailsData,
  type FilmDetailsSource,
} from "./film-details";
import { createBatchRunner, type BatchRunnerOptions } from "./tmdb-lookup";

export type FilmDetailsSyncOptions = BatchRunnerOptions & {
  /** Every film on any of the reader's lists. */
  listedIds: Iterable<Movie["id"]>;
  /** The loaded dataset, read before TMDB is asked. */
  movies: Record<Movie["id"], FilmDetailsSource | undefined>;
  people: Record<Person["id"], Pick<Person, "name">>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  read: () => Promise<FilmDetailsData>;
  write: (
    details: FilmDetailsData,
    remove?: { films?: string[]; people?: string[] },
  ) => Promise<void>;
  /** Called after each TMDB batch with how many of `total` are done. */
  onProgress?: (done: number, total: number) => void;
};

export type FilmDetailsSyncResult = {
  /** Films given details this run. */
  added: number;
  /** Films TMDB has no record of, left without details. */
  notFound: number;
  /** Films with details that were on no list, and are gone. */
  removed: number;
};

/**
 * Brings the reader's film details in line with their lists: details for every
 * listed film that has none, from the dataset where it has the film and from
 * TMDB through the search Worker where it doesn't, and none left for films no
 * list holds any more.
 *
 * Written as it goes, a TMDB batch at a time, so stopping part way — the
 * reader leaving the page, a batch that fails after its retries — keeps what
 * was done, and the next run picks up from there. Films TMDB has no record of
 * are asked about again next time, which the Worker answers from its cache.
 */
export async function syncFilmDetails({
  listedIds,
  movies,
  people,
  getIdToken,
  read,
  write,
  onProgress,
  signal,
  sleep,
  now,
}: FilmDetailsSyncOptions): Promise<FilmDetailsSyncResult> {
  const details = await read();
  const plan = planFilmDetailsSync(listedIds, details, movies);
  const result: FilmDetailsSyncResult = { added: 0, notFound: 0, removed: 0 };

  // The dataset and the tidying up cost no lookups, so they go in one write.
  const fromDataset = collectFilmDetails(plan.fromDataset, people);
  const stalePeople = getStalePeople(details, fromDataset, plan.staleFilms);
  if (
    Object.keys(fromDataset.films).length > 0 ||
    plan.staleFilms.length > 0 ||
    stalePeople.length > 0
  ) {
    signal?.throwIfAborted();
    await write(fromDataset, { films: plan.staleFilms, people: stalePeople });
    result.added += Object.keys(fromDataset.films).length;
    result.removed = plan.staleFilms.length;
  }

  const runBatch = createBatchRunner({ signal, sleep, now });
  const total = plan.fromTmdb.length;
  for (let start = 0; start < total; start += DETAILS_BATCH_SIZE) {
    const ids = plan.fromTmdb.slice(start, start + DETAILS_BATCH_SIZE);
    const results = await runBatch(() =>
      fetchTmdbDetails(ids, getIdToken, signal),
    );
    const found = results.flatMap((film) => film ?? []);
    if (found.length > 0) {
      signal?.throwIfAborted();
      await write(fromTmdbDetails(found));
    }
    result.added += found.length;
    result.notFound += ids.length - found.length;
    onProgress?.(Math.min(start + DETAILS_BATCH_SIZE, total), total);
  }
  return result;
}
