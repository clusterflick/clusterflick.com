import {
  FilterId,
  type FilterState,
  type MoviesRecord,
} from "@/lib/filters/types";
import { apply, getPermissiveState } from "@/lib/filters/manager";
import type { Festival } from "@/data/festivals";

/**
 * Returns the festival's currently-showing movies — those matching its matchers
 * with at least one upcoming performance. Matchers are OR'd together (union of
 * results), and finished performances are pruned so pages only surface what you
 * can still go and see. Used for the festival detail page.
 */
export function getFestivalMovies(
  festival: Festival,
  movies: MoviesRecord,
): MoviesRecord {
  const result: MoviesRecord = {};

  for (const matcher of festival.matchers) {
    const state: FilterState = {
      ...getPermissiveState(),
      ...matcher,
      [FilterId.HideFinished]: true,
    };
    const filtered = apply(movies, state);
    for (const [id, movie] of Object.entries(filtered)) {
      result[id] = movie;
    }
  }

  return result;
}

/**
 * Returns the earliest and latest performance timestamps across a set of movies.
 * Used on the festival list page to display the festival date range.
 */
export function getFestivalDateRange(movies: MoviesRecord): {
  dateFrom: number | null;
  dateTo: number | null;
} {
  let dateFrom: number | null = null;
  let dateTo: number | null = null;

  for (const movie of Object.values(movies)) {
    for (const performance of movie.performances) {
      if (dateFrom === null || performance.time < dateFrom)
        dateFrom = performance.time;
      if (dateTo === null || performance.time > dateTo)
        dateTo = performance.time;
    }
  }

  return { dateFrom, dateTo };
}
