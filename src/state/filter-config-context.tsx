"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import {
  AccessibilityFeature,
  AccessibilityFilterValue,
  ACCESSIBILITY_NONE,
  Category,
} from "@/types";
import {
  FilterState,
  FilterId,
  FormatFilterId,
  filterManager,
} from "@/lib/filters";
import {
  getLondonMidnightTimestamp,
  getLondonDayOfWeek,
  MS_PER_DAY,
} from "@/utils/format-date";
import { DAY_START_MINUTES, DAY_END_MINUTES } from "@/lib/filters/modules";

const SESSION_STORAGE_KEY = "clusterflick-filters";

// Event categories that can be filtered
export const EVENT_CATEGORIES: { value: Category; label: string }[] = [
  { value: Category.Movie, label: "Films" },
  { value: Category.MultipleMovies, label: "Multiple Films" },
  { value: Category.Shorts, label: "Short Films" },
  { value: Category.Tv, label: "TV" },
  { value: Category.Quiz, label: "Quizzes" },
  { value: Category.Comedy, label: "Comedy" },
  { value: Category.Music, label: "Music" },
  { value: Category.Talk, label: "Talks" },
  { value: Category.Workshop, label: "Workshops" },
  { value: Category.Event, label: "Other Events" },
];

// Venue quick-select options
export const VENUE_OPTIONS = [
  { value: "all", label: "All Venues" },
  { value: "nearby", label: "Venues Near Me" },
  { value: "cinemas", label: "Cinemas" },
  { value: "small", label: "Screening Spaces" },
] as const;

export type VenueOption = (typeof VENUE_OPTIONS)[number]["value"];

// Date quick-select options
export const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this-week", label: "This Week" },
  { value: "next-7-days", label: "Next 7 Days" },
  { value: "this-weekend", label: "This Weekend" },
  { value: "all-time", label: "All Dates" },
] as const;

export type DateOption = (typeof DATE_OPTIONS)[number]["value"];

// Time-of-day quick-select options. Bands are cinema-weighted. Boundaries are
// shared (inclusive on both ends), so a showing exactly on a boundary — e.g.
// noon — falls into both adjacent bands. This keeps the labels clean ("before
// noon", "noon to 5pm") at the cost of a 1-minute overlap.
export const TIME_OPTIONS = [
  {
    value: "any",
    label: "Any Time",
    start: DAY_START_MINUTES,
    end: DAY_END_MINUTES,
  },
  { value: "morning", label: "Morning", start: 0, end: 720 }, // before noon
  { value: "afternoon", label: "Afternoon", start: 720, end: 1020 }, // noon–5pm
  { value: "evening", label: "Evening", start: 1020, end: 1260 }, // 5pm–9pm
  { value: "late", label: "Late", start: 1260, end: DAY_END_MINUTES }, // after 9pm
] as const;

export type TimeOption = (typeof TIME_OPTIONS)[number]["value"];

/**
 * Convert a time quick-select option into a concrete time-of-day range (minutes
 * since midnight). Shared by setTimeOption so presets and inputs stay in sync.
 */
function computeTimeRange(option: TimeOption): { start: number; end: number } {
  const preset = TIME_OPTIONS.find((o) => o.value === option);
  return preset
    ? { start: preset.start, end: preset.end }
    : { start: DAY_START_MINUTES, end: DAY_END_MINUTES };
}

/**
 * Convert a date quick-select option into a concrete date range (timestamps at
 * midnight London time). "all-time" clears the range. Shared by setDateOption
 * and applyQuickFilter so both stay in sync.
 */
function computeDateRange(option: DateOption): {
  start: number | null;
  end: number | null;
} {
  if (option === "all-time") {
    return { start: null, end: null };
  }

  const todayMidnight = getLondonMidnightTimestamp();
  const dayOfWeek = getLondonDayOfWeek();

  switch (option) {
    case "today":
      return { start: todayMidnight, end: todayMidnight };
    case "tomorrow":
      return {
        start: todayMidnight + MS_PER_DAY,
        end: todayMidnight + MS_PER_DAY,
      };
    case "this-week": {
      // Start from today, end on Sunday (London time)
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      return {
        start: todayMidnight,
        end: todayMidnight + daysUntilSunday * MS_PER_DAY,
      };
    }
    case "next-7-days":
      return { start: todayMidnight, end: todayMidnight + 7 * MS_PER_DAY };
    case "this-weekend": {
      // Saturday and Sunday of this week (London time)
      let saturdayOffset: number;
      let sundayOffset: number;
      if (dayOfWeek === 0) {
        // Today is Sunday in London
        saturdayOffset = -1;
        sundayOffset = 0;
      } else if (dayOfWeek === 6) {
        // Today is Saturday in London
        saturdayOffset = 0;
        sundayOffset = 1;
      } else {
        // Weekday - find upcoming weekend
        saturdayOffset = 6 - dayOfWeek;
        sundayOffset = 7 - dayOfWeek;
      }
      return {
        start: todayMidnight + saturdayOffset * MS_PER_DAY,
        end: todayMidnight + sundayOffset * MS_PER_DAY,
      };
    }
  }
}

/**
 * A one-tap preset applied atomically. Starts from a clean default state and
 * overrides only the event categories, venues, date range, and hide-finished
 * toggle, so results are always predictable regardless of prior filters.
 */
export type QuickFilter = {
  categories: Category[] | null;
  venues: string[] | null;
  dateOption: DateOption;
  hideFinished: boolean;
};

type FilterConfigContextType = {
  filterState: FilterState;
  // Search
  setSearchQuery: (query: string) => void;
  setShowingTitleSearchQuery: (query: string) => void;
  setPerformanceNotesSearchQuery: (query: string) => void;
  // Categories
  toggleCategory: (category: Category) => void;
  selectAllCategories: () => void;
  clearAllCategories: () => void;
  // Genres
  toggleGenre: (genreId: string, allGenreIds: string[]) => void;
  selectAllGenres: () => void;
  clearAllGenres: () => void;
  // Accessibility
  toggleAccessibility: (feature: AccessibilityFilterValue) => void;
  selectAllAccessibility: () => void;
  clearAllAccessibility: () => void;
  // Format (source / presentation / dimension) — keyed by filter id
  toggleFormat: (
    filterId: FormatFilterId,
    value: string,
    allValues: string[],
  ) => void;
  selectAllFormat: (filterId: FormatFilterId) => void;
  clearAllFormat: (filterId: FormatFilterId) => void;
  // Date range (timestamps representing midnight London time)
  setDateRange: (start: number | null, end: number | null) => void;
  setDateOption: (option: DateOption) => void;
  // Time of day (minutes since midnight, 0–1439)
  setTimeRange: (start: number, end: number) => void;
  setTimeOption: (option: TimeOption) => void;
  // Venues
  setVenueOption: (option: VenueOption, venueIds: string[]) => void;
  toggleVenue: (venueId: string, allVenueIds: string[]) => void;
  selectVenues: (venueIds: string[]) => void;
  clearVenues: () => void;
  // Hide finished showings
  toggleHideFinished: () => void;
  // Quick filters (one-tap presets)
  applyQuickFilter: (quickFilter: QuickFilter) => void;
  // General
  resetFilters: () => void;
  hasActiveFilters: boolean;
  applyUrlParams: () => void;
};

const Context = createContext<FilterConfigContextType | undefined>(undefined);

export function FilterConfigProvider({ children }: { children: ReactNode }) {
  // Compute initial filter state lazily (runs once during the first render)
  // so the tree never sees stale defaults and we avoid setState-in-effect.
  // Guard browser APIs for SSR — during server render we just use defaults.
  const [filterState, setFilterState] = useState<FilterState>(() => {
    let state = filterManager.getDefaultState();

    if (typeof window === "undefined") {
      return state;
    }

    // Restore session storage (if available).
    // sanitizeFilterState fills in defaults for any keys that are missing
    // or undefined, so stale storage from before a schema change won't crash.
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        state = filterManager.sanitizeFilterState(JSON.parse(stored));
      }
    } catch {
      // Silently ignore — will use defaults
    }

    // Merge URL params on top (highest priority)
    try {
      const urlOverrides = filterManager.parseUrlParams(window.location.search);
      if (urlOverrides) {
        state = { ...state, ...urlOverrides };
      }
    } catch {
      // Malformed URL params — ignore
    }

    // Discard stale dates — if a restored start or end date is in the
    // past, fall back to the default so the user doesn't see zero results
    const todayMidnight = getLondonMidnightTimestamp();
    const dateRange = state[FilterId.DateRange];
    const defaultDateRange =
      filterManager.getDefaultState()[FilterId.DateRange];
    if (
      (dateRange.start !== null && dateRange.start < todayMidnight) ||
      (dateRange.end !== null && dateRange.end < todayMidnight)
    ) {
      state = { ...state, [FilterId.DateRange]: defaultDateRange };
    }

    return state;
  });

  // Strip URL params on mount so a refresh uses session storage.
  useEffect(() => {
    if (filterManager.parseUrlParams(window.location.search)) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Sync filter state to session storage on every change.
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filterState));
    } catch {
      // Silently ignore — storage may be full or disabled
    }
  }, [filterState]);

  // Search
  const setSearchQuery = useCallback((query: string) => {
    setFilterState((prev) => filterManager.set(prev, FilterId.Search, query));
  }, []);

  const setShowingTitleSearchQuery = useCallback((query: string) => {
    setFilterState((prev) =>
      filterManager.set(prev, FilterId.ShowingTitleSearch, query),
    );
  }, []);

  const setPerformanceNotesSearchQuery = useCallback((query: string) => {
    setFilterState((prev) =>
      filterManager.set(prev, FilterId.PerformanceNotesSearch, query),
    );
  }, []);

  // Categories
  const toggleCategory = useCallback((category: Category) => {
    setFilterState((prev) => {
      const current = filterManager.get(prev, FilterId.Categories);
      if (current === null) {
        // All selected, remove this one
        const all = EVENT_CATEGORIES.map((c) => c.value);
        return filterManager.set(
          prev,
          FilterId.Categories,
          all.filter((c) => c !== category),
        );
      }
      const index = current.indexOf(category);
      if (index >= 0) {
        // Remove
        const updated = current.filter((c) => c !== category);
        // If all removed, keep empty array (means none selected)
        return filterManager.set(prev, FilterId.Categories, updated);
      } else {
        // Add
        const updated = [...current, category];
        // If all now selected, set to null
        if (updated.length === EVENT_CATEGORIES.length) {
          return filterManager.set(prev, FilterId.Categories, null);
        }
        return filterManager.set(prev, FilterId.Categories, updated);
      }
    });
  }, []);

  const selectAllCategories = useCallback(() => {
    setFilterState((prev) =>
      filterManager.set(prev, FilterId.Categories, null),
    );
  }, []);

  const clearAllCategories = useCallback(() => {
    setFilterState((prev) => filterManager.set(prev, FilterId.Categories, []));
  }, []);

  // Genres - null means all selected (no filter), [] means none, [...] means specific
  const toggleGenre = useCallback((genreId: string, allGenreIds: string[]) => {
    setFilterState((prev) => {
      const current = filterManager.get(prev, FilterId.Genres);
      if (current === null) {
        // All selected, remove this one (select all except this)
        return filterManager.set(
          prev,
          FilterId.Genres,
          allGenreIds.filter((g) => g !== genreId),
        );
      }
      const index = current.indexOf(genreId);
      if (index >= 0) {
        // Remove
        const updated = current.filter((g) => g !== genreId);
        // If empty, keep empty array (means none selected)
        return filterManager.set(prev, FilterId.Genres, updated);
      } else {
        // Add
        const updated = [...current, genreId];
        // If all now selected, set to null
        if (updated.length === allGenreIds.length) {
          return filterManager.set(prev, FilterId.Genres, null);
        }
        return filterManager.set(prev, FilterId.Genres, updated);
      }
    });
  }, []);

  const selectAllGenres = useCallback(() => {
    setFilterState((prev) => filterManager.set(prev, FilterId.Genres, null));
  }, []);

  const clearAllGenres = useCallback(() => {
    setFilterState((prev) => filterManager.set(prev, FilterId.Genres, []));
  }, []);

  // Accessibility - null means all (no filter), [] means none, [...] means specific
  // Includes all real features plus the "none" sentinel for performances without features
  const toggleAccessibility = useCallback(
    (feature: AccessibilityFilterValue) => {
      const allValues: AccessibilityFilterValue[] = [
        ACCESSIBILITY_NONE,
        ...Object.values(AccessibilityFeature),
      ];
      setFilterState((prev) => {
        const current = filterManager.get(prev, FilterId.Accessibility);
        if (current === null) {
          // All selected (no filter), remove this one (select all except this)
          return filterManager.set(
            prev,
            FilterId.Accessibility,
            allValues.filter((f) => f !== feature),
          );
        }
        const index = current.indexOf(feature);
        if (index >= 0) {
          // Remove
          const updated = current.filter((f) => f !== feature);
          return filterManager.set(prev, FilterId.Accessibility, updated);
        } else {
          // Add
          const updated = [...current, feature];
          // If all now selected, set to null
          if (updated.length === allValues.length) {
            return filterManager.set(prev, FilterId.Accessibility, null);
          }
          return filterManager.set(prev, FilterId.Accessibility, updated);
        }
      });
    },
    [],
  );

  const selectAllAccessibility = useCallback(() => {
    setFilterState((prev) =>
      filterManager.set(prev, FilterId.Accessibility, null),
    );
  }, []);

  const clearAllAccessibility = useCallback(() => {
    setFilterState((prev) =>
      filterManager.set(prev, FilterId.Accessibility, []),
    );
  }, []);

  // Format groups — null means all selected (no filter), [] means none,
  // [...] means specific values. Shared toggle keyed by the group's filter id.
  const toggleFormat = useCallback(
    (filterId: FormatFilterId, value: string, allValues: string[]) => {
      setFilterState((prev) => {
        const current = filterManager.get(prev, filterId);
        if (current === null) {
          // All selected, remove this one (select all except this)
          return filterManager.set(
            prev,
            filterId,
            allValues.filter((v) => v !== value),
          );
        }
        if (current.includes(value)) {
          // Remove
          return filterManager.set(
            prev,
            filterId,
            current.filter((v) => v !== value),
          );
        }
        // Add — if all now selected, collapse to null (no filter)
        const updated = [...current, value];
        if (updated.length === allValues.length) {
          return filterManager.set(prev, filterId, null);
        }
        return filterManager.set(prev, filterId, updated);
      });
    },
    [],
  );

  const selectAllFormat = useCallback((filterId: FormatFilterId) => {
    setFilterState((prev) => filterManager.set(prev, filterId, null));
  }, []);

  const clearAllFormat = useCallback((filterId: FormatFilterId) => {
    setFilterState((prev) => filterManager.set(prev, filterId, []));
  }, []);

  // Date range (all timestamps represent midnight London time)
  const setDateRange = useCallback(
    (start: number | null, end: number | null) => {
      setFilterState((prev) =>
        filterManager.set(prev, FilterId.DateRange, { start, end }),
      );
    },
    [],
  );

  const setDateOption = useCallback((option: DateOption) => {
    setFilterState((prev) =>
      filterManager.set(prev, FilterId.DateRange, computeDateRange(option)),
    );
  }, []);

  // Time of day (minutes since midnight)
  const setTimeRange = useCallback((start: number, end: number) => {
    setFilterState((prev) =>
      filterManager.set(prev, FilterId.TimeRange, { start, end }),
    );
  }, []);

  const setTimeOption = useCallback((option: TimeOption) => {
    setFilterState((prev) =>
      filterManager.set(prev, FilterId.TimeRange, computeTimeRange(option)),
    );
  }, []);

  // Venues
  const setVenueOption = useCallback(
    (option: VenueOption, venueIds: string[]) => {
      setFilterState((prev) => {
        switch (option) {
          case "cinemas":
          case "small":
          case "nearby":
            return filterManager.set(prev, FilterId.Venues, venueIds);
          default:
            return prev;
        }
      });
    },
    [],
  );

  const toggleVenue = useCallback((venueId: string, allVenueIds: string[]) => {
    setFilterState((prev) => {
      const current = filterManager.get(prev, FilterId.Venues);
      if (current === null) {
        // All selected, remove this one (select all except this)
        return filterManager.set(
          prev,
          FilterId.Venues,
          allVenueIds.filter((v) => v !== venueId),
        );
      }
      const index = current.indexOf(venueId);
      if (index >= 0) {
        // Remove
        const updated = current.filter((v) => v !== venueId);
        if (updated.length === 0) {
          // Empty means none selected
          return filterManager.set(prev, FilterId.Venues, []);
        }
        return filterManager.set(prev, FilterId.Venues, updated);
      } else {
        // Add
        const updated = [...current, venueId];
        // If all now selected, set to null
        if (updated.length === allVenueIds.length) {
          return filterManager.set(prev, FilterId.Venues, null);
        }
        return filterManager.set(prev, FilterId.Venues, updated);
      }
    });
  }, []);

  const selectVenues = useCallback((venueIds: string[]) => {
    setFilterState((prev) =>
      filterManager.set(prev, FilterId.Venues, venueIds),
    );
  }, []);

  const clearVenues = useCallback(() => {
    setFilterState((prev) => filterManager.set(prev, FilterId.Venues, null));
  }, []);

  // Hide finished showings
  const toggleHideFinished = useCallback(() => {
    setFilterState((prev) =>
      filterManager.set(
        prev,
        FilterId.HideFinished,
        !filterManager.get(prev, FilterId.HideFinished),
      ),
    );
  }, []);

  // Quick filters — apply a preset atomically on top of a clean default state
  // so results never depend on whatever filters were previously set.
  const applyQuickFilter = useCallback((quickFilter: QuickFilter) => {
    let next = filterManager.getDefaultState();
    next = filterManager.set(next, FilterId.Categories, quickFilter.categories);
    next = filterManager.set(next, FilterId.Venues, quickFilter.venues);
    next = filterManager.set(
      next,
      FilterId.DateRange,
      computeDateRange(quickFilter.dateOption),
    );
    next = filterManager.set(
      next,
      FilterId.HideFinished,
      quickFilter.hideFinished,
    );
    setFilterState(next);
  }, []);

  // General
  const resetFilters = useCallback(() => {
    setFilterState(filterManager.getDefaultState);
  }, []);

  const applyUrlParams = useCallback(() => {
    const overrides = filterManager.parseUrlParams(window.location.search);
    if (!overrides) return;
    setFilterState((prev) => ({ ...prev, ...overrides }));
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filterManager.hasActiveFilters(filterState);
  }, [filterState]);

  const contextValue = useMemo(
    () => ({
      filterState,
      setSearchQuery,
      setShowingTitleSearchQuery,
      setPerformanceNotesSearchQuery,
      toggleCategory,
      selectAllCategories,
      clearAllCategories,
      toggleGenre,
      selectAllGenres,
      clearAllGenres,
      toggleAccessibility,
      selectAllAccessibility,
      clearAllAccessibility,
      toggleFormat,
      selectAllFormat,
      clearAllFormat,
      setDateRange,
      setDateOption,
      setTimeRange,
      setTimeOption,
      setVenueOption,
      toggleVenue,
      selectVenues,
      clearVenues,
      toggleHideFinished,
      applyQuickFilter,
      resetFilters,
      hasActiveFilters,
      applyUrlParams,
    }),
    [
      filterState,
      setSearchQuery,
      setShowingTitleSearchQuery,
      setPerformanceNotesSearchQuery,
      toggleCategory,
      selectAllCategories,
      clearAllCategories,
      toggleGenre,
      selectAllGenres,
      clearAllGenres,
      toggleAccessibility,
      selectAllAccessibility,
      clearAllAccessibility,
      toggleFormat,
      selectAllFormat,
      clearAllFormat,
      setDateRange,
      setDateOption,
      setTimeRange,
      setTimeOption,
      setVenueOption,
      toggleVenue,
      selectVenues,
      clearVenues,
      toggleHideFinished,
      applyQuickFilter,
      resetFilters,
      hasActiveFilters,
      applyUrlParams,
    ],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

export function useFilterConfig() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error(
      "useFilterConfig must be used within a FilterConfigProvider",
    );
  }
  return context;
}
