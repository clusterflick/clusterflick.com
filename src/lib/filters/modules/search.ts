import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/**
 * Normalize a string for fuzzy matching:
 * - Convert to lowercase
 * - Remove diacritics (é → e, ñ → n, etc.)
 * - Remove common punctuation (apostrophes, colons, periods, etc.)
 */
const normalizeForSearch = (str: string): string => {
  return (
    str
      .toLowerCase()
      // Remove diacritics: normalize to NFD (decomposed form), then strip combining marks
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remove common punctuation that might differ between query and title
      .replace(/[''`´]/g, "") // apostrophes and similar
      .replace(/[.:;,!?]/g, "") // common punctuation
      .replace(/[-–—]/g, " ") // dashes to spaces
      .replace(/\s+/g, " ") // collapse multiple spaces
      .trim()
  );
};

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
