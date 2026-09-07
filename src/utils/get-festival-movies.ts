import type { MoviesRecord } from "@/lib/filters/types";
import { applyMatchers } from "@/lib/filters/apply-matchers";
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
  return applyMatchers(festival.matchers, movies);
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
