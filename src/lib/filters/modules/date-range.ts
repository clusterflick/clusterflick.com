import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
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
    const defaultRange = getDefaultDateRange();
    return (
      state.dateRange.start !== defaultRange.start ||
      state.dateRange.end !== defaultRange.end
    );
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const { start, end } = state.dateRange;

    // No date filter applied
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
