import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import {
  getLondonMinutesOfDay,
  minutesToTimeString,
  timeStringToMinutes,
} from "@/utils/format-date";
import { pruneByPerformances } from "@/utils/prune-movies";

/** Minutes since midnight for the start (00:00) and end (23:59) of a day. */
export const DAY_START_MINUTES = 0;
export const DAY_END_MINUTES = 1439;

/**
 * The default time-of-day range: the full day (00:00–23:59), which is a no-op.
 */
function getDefaultTimeRange(): { start: number; end: number } {
  return { start: DAY_START_MINUTES, end: DAY_END_MINUTES };
}

/**
 * Time-of-day filter module.
 * Filters performances by their London time-of-day, independent of date, so it
 * composes with the date-range filter (e.g. "mornings over the next 7 days").
 * Values are minutes since midnight (0–1439). Both bounds are inclusive.
 *
 * Default: the full day (00:00–23:59), which applies no filtering.
 */
export const timeRangeFilter: FilterModule<FilterId.TimeRange> = {
  id: FilterId.TimeRange,

  getDefault: () => getDefaultTimeRange(),

  get: (state: FilterState) => state.timeRange,

  set: (
    state: FilterState,
    value: { start: number; end: number },
  ): FilterState => ({
    ...state,
    timeRange: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    const range = state.timeRange;
    if (!range) return false;
    return range.start !== DAY_START_MINUTES || range.end !== DAY_END_MINUTES;
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    const range = state.timeRange;
    if (!range) return;
    if (range.start !== DAY_START_MINUTES) {
      params.set("timeStart", minutesToTimeString(range.start));
    }
    if (range.end !== DAY_END_MINUTES) {
      params.set("timeEnd", minutesToTimeString(range.end));
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    // An explicit time band round-trips (e.g. a shared "evenings only" link).
    // When no time param is present we return undefined and let the resolved
    // base state supply the value — `base=all`/`base=default` both reset the
    // band to the full day, so "browse everything" links open it up too.
    if (params.has("timeStart") || params.has("timeEnd")) {
      const startStr = params.get("timeStart");
      const endStr = params.get("timeEnd");

      const start = startStr
        ? timeStringToMinutes(startStr)
        : DAY_START_MINUTES;
      const end = endStr ? timeStringToMinutes(endStr) : DAY_END_MINUTES;

      if (isNaN(start) || isNaN(end)) {
        return undefined;
      }
      return { start, end };
    }

    return undefined;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const range = state.timeRange;

    // No filter, or the full-day range (a no-op)
    if (
      !range ||
      (range.start <= DAY_START_MINUTES && range.end >= DAY_END_MINUTES)
    ) {
      return movies;
    }

    const { start, end } = range;

    return pruneByPerformances(movies, (perf) => {
      const minutes = getLondonMinutesOfDay(perf.time);
      return minutes >= start && minutes <= end;
    });
  },
};
