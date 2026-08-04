import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { pruneByPerformances } from "@/utils/prune-movies";

/**
 * Hide sold out showings filter module.
 * When toggled on, filters out performances the venue has marked sold out.
 * - `false` = show all showings including sold out ones (default)
 * - `true` = hide sold out showings
 *
 * Only some venues report availability, so an unmarked performance is treated as
 * available rather than unknown — hiding everything we simply have no status for
 * would quietly wipe out most of the listings.
 */
export const hideSoldOutFilter: FilterModule<FilterId.HideSoldOut> = {
  id: FilterId.HideSoldOut,

  getDefault: () => false,

  get: (state: FilterState) => state.hideSoldOut,

  set: (state: FilterState, value: boolean): FilterState => ({
    ...state,
    hideSoldOut: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => state.hideSoldOut === true,

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    if (!state.hideSoldOut) return movies;
    return pruneByPerformances(movies, (perf) => !perf.status?.soldOut);
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    if (state.hideSoldOut) {
      params.set("hideSoldOut", "true");
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (params.has("hideSoldOut") && params.get("hideSoldOut") === "true") {
      return true;
    }
    return undefined;
  },
};
