import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { matchesSearchQuery, normalizeForSearch } from "../normalize";

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
    return (state.search ?? "").trim().length > 0;
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    if ((state.search ?? "").trim().length > 0) {
      params.set("search", state.search);
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (params.has("search")) {
      return params.get("search")!;
    }
    return undefined;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const query = normalizeForSearch(state.search ?? "");

    // No search query = no filtering
    if (query.length === 0) {
      return movies;
    }

    const result: MoviesRecord = {};

    for (const [id, movie] of Object.entries(movies)) {
      // Match against alternative spellings of both titles
      const titleMatch =
        matchesSearchQuery(movie.normalizedTitle || "", query) ||
        matchesSearchQuery(movie.title, query);

      if (titleMatch) {
        result[id] = movie;
      }
    }

    return result;
  },
};
