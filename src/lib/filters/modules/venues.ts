import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { pruneByShowings } from "@/utils/prune-movies";

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
    return pruneByShowings(movies, (showing) => venueSet.has(showing.venueId));
  },
};
