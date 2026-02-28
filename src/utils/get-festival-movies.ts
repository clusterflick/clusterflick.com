import {
  FilterId,
  type FilterState,
  type MoviesRecord,
} from "@/lib/filters/types";
import { apply } from "@/lib/filters/manager";
import type { Festival } from "@/data/festivals";

function buildPermissiveBase(): FilterState {
  return {
    [FilterId.Search]: "",
    [FilterId.ShowingTitleSearch]: "",
    [FilterId.ShowingUrlSearch]: "",
    [FilterId.PerformanceNotesSearch]: "",
    [FilterId.Categories]: null,
    [FilterId.Venues]: null,
    [FilterId.DateRange]: { start: null, end: null },
    [FilterId.Genres]: null,
    [FilterId.Accessibility]: null,
    [FilterId.HideFinished]: false,
  };
}

/**
 * Returns the subset of movies matching the festival's matchers.
 * Matchers are OR'd together (union of results).
 * Used for the festival detail page.
 */
export function getFestivalMovies(
  festival: Festival,
  movies: MoviesRecord,
): MoviesRecord {
  const result: MoviesRecord = {};

  for (const matcher of festival.matchers) {
    const state: FilterState = {
      ...buildPermissiveBase(),
      ...matcher,
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

/**
 * Returns true if the festival has any currently-showing films
 * (i.e. at least one future performance matches the festival's matchers).
 * Used on the festival list page to filter out past festivals.
 */
export function isFestivalCurrentlyShowing(
  festival: Festival,
  movies: MoviesRecord,
): boolean {
  for (const matcher of festival.matchers) {
    const state: FilterState = {
      ...buildPermissiveBase(),
      ...matcher,
      [FilterId.HideFinished]: true,
    };
    if (Object.keys(apply(movies, state)).length > 0) {
      return true;
    }
  }
  return false;
}
