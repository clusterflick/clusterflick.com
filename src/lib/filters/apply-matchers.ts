import type { FilterState, MoviesRecord } from "./types";
import { matchAny } from "./manager";
import { pruneByPerformances } from "@/utils/prune-movies";

const cache = new WeakMap<
  MoviesRecord,
  WeakMap<Partial<FilterState>[], MoviesRecord>
>();

/**
 * Runs a set of OR'd matchers (a film club's or festival's) over the dataset,
 * returning the movies they identify with only their matching showings and
 * performances, and finished performances pruned — what a club or festival page
 * lists. See `createMatchAny` for how the matchers' results are combined.
 *
 * Inside the films grid the same matchers run through the film club and
 * festival filters instead, which leave finished showings to the reader's
 * hide-finished setting.
 *
 * Results are memoised per dataset and matcher set. Every movie, venue and
 * borough page asks which festivals and clubs it belongs to, and each answer
 * used to run every registered club's and festival's matchers over the whole
 * dataset again. Callers get a shared record and must not mutate it.
 */
export function applyMatchers(
  matchers: Partial<FilterState>[],
  movies: MoviesRecord,
): MoviesRecord {
  let byMatchers = cache.get(movies);
  if (!byMatchers) {
    byMatchers = new WeakMap();
    cache.set(movies, byMatchers);
  }

  let result = byMatchers.get(matchers);
  if (!result) {
    const now = Date.now();
    result = pruneByPerformances(
      matchAny(matchers, movies),
      (performance) => performance.time >= now,
    );
    byMatchers.set(matchers, result);
  }
  return result;
}
