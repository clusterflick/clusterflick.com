import {
  FilterId,
  type FilterState,
  type MoviesRecord,
} from "@/lib/filters/types";
import { apply } from "@/lib/filters/manager";
import type { FilmClub } from "@/data/film-clubs";

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
 * Returns the subset of movies matching the film club's matchers.
 * Matchers are OR'd together (union of results).
 */
export function getFilmClubMovies(
  club: FilmClub,
  movies: MoviesRecord,
): MoviesRecord {
  const result: MoviesRecord = {};

  for (const matcher of club.matchers) {
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
 */
export function getFilmClubDateRange(movies: MoviesRecord): {
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
 * Returns the subset of movies currently showing for a film club
 * (i.e. with at least one future performance).
 */
export function getFilmClubCurrentMovies(
  club: FilmClub,
  movies: MoviesRecord,
): MoviesRecord {
  const result: MoviesRecord = {};

  for (const matcher of club.matchers) {
    const state: FilterState = {
      ...buildPermissiveBase(),
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
