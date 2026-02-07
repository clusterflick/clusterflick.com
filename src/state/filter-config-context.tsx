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
import { Category } from "@/types";
import { FilterState, FilterId, filterManager } from "@/lib/filters";
import {
  getLondonMidnightTimestamp,
  getLondonDayOfWeek,
  MS_PER_DAY,
} from "@/utils/format-date";

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
  { value: "all-time", label: "All Time" },
] as const;

export type DateOption = (typeof DATE_OPTIONS)[number]["value"];

type FilterConfigContextType = {
  filterState: FilterState;
  // Search
  setSearchQuery: (query: string) => void;
  setShowingTitleSearchQuery: (query: string) => void;
  // Categories
  toggleCategory: (category: Category) => void;
  selectAllCategories: () => void;
  clearAllCategories: () => void;
  // Genres
  toggleGenre: (genreId: string, allGenreIds: string[]) => void;
  selectAllGenres: () => void;
  clearAllGenres: () => void;
  // Date range (timestamps representing midnight London time)
  setDateRange: (start: number | null, end: number | null) => void;
  setDateOption: (option: DateOption) => void;
  // Venues
  setVenueOption: (option: VenueOption, venueIds: string[]) => void;
  toggleVenue: (venueId: string, allVenueIds: string[]) => void;
  selectVenues: (venueIds: string[]) => void;
  clearVenues: () => void;
  // General
  resetFilters: () => void;
  hasActiveFilters: boolean;
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

    // Merge session storage (if available)
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        state = JSON.parse(stored) as FilterState;
      }
    } catch {
      // Silently ignore — will use defaults
    }

    // Merge URL params on top (highest priority)
    const urlOverrides = filterManager.parseUrlParams(window.location.search);
    if (urlOverrides) {
      state = { ...state, ...urlOverrides };
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
    // Get today's midnight in London as a timestamp
    const todayMidnight = getLondonMidnightTimestamp();
    const dayOfWeek = getLondonDayOfWeek();

    let start: number;
    let end: number;

    switch (option) {
      case "today":
        start = todayMidnight;
        end = todayMidnight;
        break;
      case "tomorrow":
        start = todayMidnight + MS_PER_DAY;
        end = todayMidnight + MS_PER_DAY;
        break;
      case "this-week": {
        // Start from today, end on Sunday (London time)
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        start = todayMidnight;
        end = todayMidnight + daysUntilSunday * MS_PER_DAY;
        break;
      }
      case "next-7-days":
        start = todayMidnight;
        end = todayMidnight + 7 * MS_PER_DAY;
        break;
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
        start = todayMidnight + saturdayOffset * MS_PER_DAY;
        end = todayMidnight + sundayOffset * MS_PER_DAY;
        break;
      }
      case "all-time":
        start = todayMidnight;
        end = todayMidnight + 5 * 365 * MS_PER_DAY; // ~5 years
        break;
      default:
        return;
    }

    setFilterState((prev) =>
      filterManager.set(prev, FilterId.DateRange, { start, end }),
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

  // General
  const resetFilters = useCallback(() => {
    setFilterState(filterManager.getDefaultState);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filterManager.hasActiveFilters(filterState);
  }, [filterState]);

  const contextValue = useMemo(
    () => ({
      filterState,
      setSearchQuery,
      setShowingTitleSearchQuery,
      toggleCategory,
      selectAllCategories,
      clearAllCategories,
      toggleGenre,
      selectAllGenres,
      clearAllGenres,
      setDateRange,
      setDateOption,
      setVenueOption,
      toggleVenue,
      selectVenues,
      clearVenues,
      resetFilters,
      hasActiveFilters,
    }),
    [
      filterState,
      setSearchQuery,
      setShowingTitleSearchQuery,
      toggleCategory,
      selectAllCategories,
      clearAllCategories,
      toggleGenre,
      selectAllGenres,
      clearAllGenres,
      setDateRange,
      setDateOption,
      setVenueOption,
      toggleVenue,
      selectVenues,
      clearVenues,
      resetFilters,
      hasActiveFilters,
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
