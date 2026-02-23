import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { normalizeForSearch } from "../normalize";

/**
 * Performance notes search filter module.
 * Filters movies to only include those with performances whose notes
 * match the search query (case-insensitive, accent-insensitive).
 * Performances without matching notes are removed from the results.
 */
export const performanceNotesSearchFilter: FilterModule<FilterId.PerformanceNotesSearch> =
  {
    id: FilterId.PerformanceNotesSearch,

    getDefault: () => "",

    get: (state: FilterState) => state.performanceNotesSearch,

    set: (state: FilterState, value: string): FilterState => ({
      ...state,
      performanceNotesSearch: value,
    }),

    hasActiveFilter: (state: FilterState): boolean => {
      return (state.performanceNotesSearch ?? "").trim().length > 0;
    },

    toUrlParams: (state: FilterState, params: URLSearchParams) => {
      if ((state.performanceNotesSearch ?? "").trim().length > 0) {
        params.set("performanceNotes", state.performanceNotesSearch);
      }
    },

    fromUrlParams: (params: URLSearchParams) => {
      if (params.has("performanceNotes")) {
        return params.get("performanceNotes")!;
      }
      return undefined;
    },

    apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
      const query = normalizeForSearch(state.performanceNotesSearch ?? "");

      if (query.length === 0) {
        return movies;
      }

      const result: MoviesRecord = {};

      for (const [id, movie] of Object.entries(movies)) {
        const matchingPerformances = movie.performances.filter(
          (performance) =>
            performance.notes &&
            normalizeForSearch(performance.notes).includes(query),
        );

        if (matchingPerformances.length > 0) {
          result[id] = { ...movie, performances: matchingPerformances };
        }
      }

      return result;
    },
  };
