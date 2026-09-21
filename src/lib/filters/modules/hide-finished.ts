import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { pruneByPerformances } from "@/utils/prune-movies";

/**
 * Hide finished showings filter module.
 * When toggled on, filters out performances whose start time has passed.
 * - `true` = hide finished showings (default)
 * - `false` = show all showings including past ones
 *
 * On by default: a showing that has started is no use to someone deciding what
 * to see, and the planner's by-time view was a screenful of "Finished" before
 * the next thing on. Like the date range, that makes the default restrictive,
 * so "active" means "differs from the default" and the permissive state turns
 * it off explicitly.
 */
export const hideFinishedFilter: FilterModule<FilterId.HideFinished> = {
  id: FilterId.HideFinished,

  getDefault: () => true,

  get: (state: FilterState) => state.hideFinished,

  set: (state: FilterState, value: boolean): FilterState => ({
    ...state,
    hideFinished: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => state.hideFinished !== true,

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    if (!state.hideFinished) return movies;
    const now = Date.now();
    return pruneByPerformances(movies, (perf) => perf.time >= now);
  },

  // Only the departure from the default is written. An explicit "true" is
  // still read, so links shared before the default changed keep working.
  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    if (!state.hideFinished) {
      params.set("hideFinished", "false");
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    const value = params.get("hideFinished");
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
  },
};
