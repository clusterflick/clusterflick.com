import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { normalizeForSearch } from "../normalize";

/**
 * Search filter module.
 * Filters movies by title (case-insensitive, accent-insensitive, punctuation-forgiving match).
 */
export const searchFilter: FilterModule<FilterId.Search> = {
  id: FilterId.Search,

  getDefault: () => "",

  get: (state: FilterState) => state.search,

  set: (state: FilterState, value: string): FilterState => ({
    ...state,
    search: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    return state.search.trim().length > 0;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const query = normalizeForSearch(state.search);

    // No search query = no filtering
    if (query.length === 0) {
      return movies;
    }

    const result: MoviesRecord = {};

    for (const [id, movie] of Object.entries(movies)) {
      // Match against normalized versions of both titles
      const normalizedTitle = normalizeForSearch(movie.normalizedTitle || "");
      const regularTitle = normalizeForSearch(movie.title);

      const titleMatch =
        normalizedTitle.includes(query) || regularTitle.includes(query);

      if (titleMatch) {
        result[id] = movie;
      }
    }

    return result;
  },
};
