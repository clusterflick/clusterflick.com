import { MoviePerformance } from "@/types";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/**
 * Venues filter module.
 * Filters movies by venue IDs, also filters performances within each movie.
 * - `null` = no filter (all venues included)
 * - `[]` = no venues selected (no movies match)
 */
export const venuesFilter: FilterModule<FilterId.Venues> = {
  id: FilterId.Venues,

  getDefault: () => null,

  get: (state: FilterState) => state.venues,

  set: (state: FilterState, value: string[] | null): FilterState => ({
    ...state,
    venues: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    return state.venues !== null;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const venues = state.venues;

    // null = no filter, include all
    if (venues === null) {
      return movies;
    }

    // Empty array = none selected, no movies match
    if (venues.length === 0) {
      return {};
    }

    const venueSet = new Set(venues);
    const result: MoviesRecord = {};

    for (const [id, movie] of Object.entries(movies)) {
      // Filter showings to only those at selected venues
      const filteredShowings: typeof movie.showings = {};
      for (const [showingId, showing] of Object.entries(movie.showings)) {
        if (venueSet.has(showing.venueId)) {
          filteredShowings[showingId] = showing;
        }
      }

      // If no showings remain, skip this movie
      if (Object.keys(filteredShowings).length === 0) {
        continue;
      }

      // Filter performances to only those with remaining showings
      const validShowingIds = new Set(Object.keys(filteredShowings));
      const filteredPerformances: MoviePerformance[] =
        movie.performances.filter((perf) =>
          validShowingIds.has(perf.showingId),
        );

      // If no performances remain, skip this movie
      if (filteredPerformances.length === 0) {
        continue;
      }

      result[id] = {
        ...movie,
        showings: filteredShowings,
        performances: filteredPerformances,
      };
    }

    return result;
  },
};
