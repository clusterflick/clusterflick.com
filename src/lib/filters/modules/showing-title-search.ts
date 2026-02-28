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
      return (state.showingTitleSearch ?? "").trim().length > 0;
    },

    toUrlParams: (state: FilterState, params: URLSearchParams) => {
      if ((state.showingTitleSearch ?? "").trim().length > 0) {
        params.set("showingTitle", state.showingTitleSearch);
      }
    },

    fromUrlParams: (params: URLSearchParams) => {
      if (params.has("showingTitle")) {
        return params.get("showingTitle")!;
      }
      return undefined;
    },

    apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
      const query = normalizeForSearch(state.showingTitleSearch ?? "");

      // No search query = no filtering
      if (query.length === 0) {
        return movies;
      }

      const result: MoviesRecord = {};

      for (const [id, movie] of Object.entries(movies)) {
        // Keep only showings whose title matches the query.
        // showing.title is only set when it differs from the movie title,
        // so fall back to movie.title when absent.
        const filteredShowings: typeof movie.showings = {};

        for (const [showingId, showing] of Object.entries(movie.showings)) {
          const title = showing.title || movie.title;
          if (normalizeForSearch(title).includes(query)) {
            filteredShowings[showingId] = showing;
          }
        }

        if (Object.keys(filteredShowings).length === 0) continue;

        const validShowingIds = new Set(Object.keys(filteredShowings));
        const filteredPerformances = movie.performances.filter((p) =>
          validShowingIds.has(p.showingId),
        );

        if (filteredPerformances.length === 0) continue;

        result[id] = {
          ...movie,
          showings: filteredShowings,
          performances: filteredPerformances,
        };
      }

      return result;
    },
  };
