import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { pruneByShowings } from "@/utils/prune-movies";

/**
 * Showing URL search filter module.
 * Filters movies to those with at least one showing whose URL contains the
 * given substring (case-insensitive). Used internally by film club matchers —
 * no UI or URL param support.
 */
export const showingUrlSearchFilter: FilterModule<FilterId.ShowingUrlSearch> = {
  id: FilterId.ShowingUrlSearch,

  getDefault: () => "",

  get: (state: FilterState) => state.showingUrlSearch,

  set: (state: FilterState, value: string): FilterState => ({
    ...state,
    showingUrlSearch: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    return (state.showingUrlSearch ?? "").trim().length > 0;
  },

  toUrlParams: () => {
    // No URL param support — internal use only
  },

  fromUrlParams: () => {
    return undefined;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const query = (state.showingUrlSearch ?? "").trim().toLowerCase();

    if (query.length === 0) {
      return movies;
    }

    return pruneByShowings(movies, (showing) =>
      showing.url.toLowerCase().includes(query),
    );
  },
};
