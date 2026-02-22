import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { pruneByPerformances } from "@/utils/prune-movies";

/**
 * Hide finished showings filter module.
 * When toggled on, filters out performances whose start time has passed.
 * - `false` = show all showings including past ones (default)
 * - `true` = hide finished showings
 */
export const hideFinishedFilter: FilterModule<FilterId.HideFinished> = {
  id: FilterId.HideFinished,

  getDefault: () => false,

  get: (state: FilterState) => state.hideFinished,

  set: (state: FilterState, value: boolean): FilterState => ({
    ...state,
    hideFinished: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => state.hideFinished === true,

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    if (!state.hideFinished) return movies;
    const now = Date.now();
    return pruneByPerformances(movies, (perf) => perf.time >= now);
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    if (state.hideFinished) {
      params.set("hideFinished", "true");
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (params.has("hideFinished") && params.get("hideFinished") === "true") {
      return true;
    }
    return undefined;
  },
};
