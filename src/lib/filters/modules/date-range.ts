import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import {
  getLondonMidnightTimestamp,
  dateStringToLondonTimestamp,
  timestampToLondonDateString,
  MS_PER_DAY,
} from "@/utils/format-date";
import { pruneByPerformances } from "@/utils/prune-movies";

/**
 * Gets the default date range: today to 7 days from now (in London time).
 * Returns timestamps representing midnight London time for start and end dates.
 */
function getDefaultDateRange(): { start: number; end: number } {
  const todayMidnight = getLondonMidnightTimestamp();
  return {
    start: todayMidnight,
    end: todayMidnight + 7 * MS_PER_DAY,
  };
}

/**
 * Date range filter module.
 * Filters performances by date, removing movies with no remaining performances.
 * - Both `start` and `end` as `null` = no filter
 * - Only `start` set = from that date onwards
 * - Only `end` set = up to that date
 * - Both set = within the range (inclusive)
 *
 * Default: today to 7 days from now.
 */
export const dateRangeFilter: FilterModule<FilterId.DateRange> = {
  id: FilterId.DateRange,

  getDefault: () => getDefaultDateRange(),

  get: (state: FilterState) => state.dateRange,

  set: (
    state: FilterState,
    value: { start: number | null; end: number | null },
  ): FilterState => ({
    ...state,
    dateRange: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    const range = state.dateRange;
    if (!range) return false;
    const defaultRange = getDefaultDateRange();
    return range.start !== defaultRange.start || range.end !== defaultRange.end;
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    const defaultRange = getDefaultDateRange();
    const { start, end } = state.dateRange ?? defaultRange;
    if (start !== defaultRange.start || end !== defaultRange.end) {
      if (start === null && end === null) {
        params.set("allDates", "true");
      } else {
        if (start !== null) {
          params.set("dateStart", timestampToLondonDateString(start));
        }
        if (end !== null) {
          params.set("dateEnd", timestampToLondonDateString(end));
        }
      }
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (params.has("allDates")) {
      return { start: null, end: null };
    }
    if (!params.has("dateStart") && !params.has("dateEnd")) {
      return undefined;
    }
    const defaults = getDefaultDateRange();
    const startStr = params.get("dateStart");
    const endStr = params.get("dateEnd");

    const start = startStr
      ? dateStringToLondonTimestamp(startStr)
      : defaults.start;
    const end = endStr ? dateStringToLondonTimestamp(endStr) : defaults.end;

    // Only apply if we got valid numbers
    if ((start === null || !isNaN(start)) && (end === null || !isNaN(end))) {
      return { start, end };
    }
    return undefined;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const range = state.dateRange;

    // No date filter applied
    if (!range) {
      return movies;
    }

    const { start, end } = range;

    if (start === null && end === null) {
      return movies;
    }

    // End timestamp represents midnight of the end date, so we add a day
    // to include performances on that date (using < comparison)
    const endTimestamp = end !== null ? end + MS_PER_DAY : null;

    return pruneByPerformances(movies, (perf) => {
      if (start !== null && perf.time < start) {
        return false;
      }
      if (endTimestamp !== null && perf.time >= endTimestamp) {
        return false;
      }
      return true;
    });
  },
};
