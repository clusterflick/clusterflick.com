import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { normalizeForSearch } from "../normalize";

/**
 * Showing title search filter module.
 * Filters movies by the original showing title from the cinema
 * (case-insensitive, accent-insensitive, punctuation-forgiving match).
 */
export const showingTitleSearchFilter: FilterModule<FilterId.ShowingTitleSearch> =
  {
    id: FilterId.ShowingTitleSearch,

    getDefault: () => "",

    get: (state: FilterState) => state.showingTitleSearch,

    set: (state: FilterState, value: string): FilterState => ({
      ...state,
      showingTitleSearch: value,
    }),

    hasActiveFilter: (state: FilterState): boolean => {
      return state.showingTitleSearch.trim().length > 0;
    },

    apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
      const query = normalizeForSearch(state.showingTitleSearch);

      // No search query = no filtering
      if (query.length === 0) {
        return movies;
      }

      const result: MoviesRecord = {};

      for (const [id, movie] of Object.entries(movies)) {
        // Check if any showing title matches the query.
        // showing.title is only set when it differs from the movie title,
        // so fall back to movie.title when absent.
        const showingTitleMatch = Object.values(movie.showings).some(
          (showing) => {
            const title = showing.title || movie.title;
            return normalizeForSearch(title).includes(query);
          },
        );

        if (showingTitleMatch) {
          result[id] = movie;
        }
      }

      return result;
    },
  };
