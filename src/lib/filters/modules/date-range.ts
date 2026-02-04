import { MoviePerformance } from "@/types";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";

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

    const result: MoviesRecord = {};

    for (const [id, movie] of Object.entries(movies)) {
      // Filter performances by date using fast timestamp comparisons
      const filteredPerformances: MoviePerformance[] =
        movie.performances.filter((perf) => {
          if (start !== null && perf.time < start) {
            return false;
          }
          if (endTimestamp !== null && perf.time >= endTimestamp) {
            return false;
          }

          return true;
        });

      // If no performances remain, skip this movie
      if (filteredPerformances.length === 0) {
        continue;
      }

      // Filter showings to only those with remaining performances
      const remainingShowingIds = new Set(
        filteredPerformances.map((p) => p.showingId),
      );
      const filteredShowings: typeof movie.showings = {};
      for (const [showingId, showing] of Object.entries(movie.showings)) {
        if (remainingShowingIds.has(showingId)) {
          filteredShowings[showingId] = showing;
        }
      }

      result[id] = {
        ...movie,
        showings: filteredShowings,
        performances: filteredPerformances,
      };
    }

    return result;
  },
};
