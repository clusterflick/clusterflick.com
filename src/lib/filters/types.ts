import { Category, Movie } from "@/types";

/**
 * Enum of all filter IDs for consistent usage across the codebase.
 */
export enum FilterId {
  Search = "search",
  ShowingTitleSearch = "showingTitleSearch",
  Categories = "categories",
  Venues = "venues",
  DateRange = "dateRange",
  Genres = "genres",
}

/**
 * The serializable filter state.
 * - `null` means "no filter applied" (all items included)
 * - Empty array `[]` means "none selected" (no items match)
 */
export type FilterState = {
  [FilterId.Search]: string;
  [FilterId.ShowingTitleSearch]: string;
  [FilterId.Categories]: Category[] | null;
  [FilterId.Venues]: string[] | null;
  [FilterId.DateRange]: { start: number | null; end: number | null };
  [FilterId.Genres]: string[] | null;
};

/**
 * The movies data structure used throughout the app.
 */
export type MoviesRecord = Record<string, Movie>;

/**
 * Interface for a filter module.
 * Each module handles one aspect of filtering with full type safety.
 */
export interface FilterModule<K extends FilterId> {
  /** Unique identifier, matches the key in FilterState */
  id: K;

  /** Returns the default value for this filter (no filter applied) */
  getDefault: () => FilterState[K];

  /** Gets the current value from the filter state */
  get: (state: FilterState) => FilterState[K];

  /** Sets a new value, returning an updated filter state (no mutation) */
  set: (state: FilterState, value: FilterState[K]) => FilterState;

  /** Returns true if this filter is actively filtering (not at default) */
  hasActiveFilter: (state: FilterState) => boolean;

  /**
   * Applies this filter to the movies data.
   * Returns a new movies record with filtering applied.
   * May filter performances within movies and remove movies with no remaining performances.
   */
  apply: (movies: MoviesRecord, state: FilterState) => MoviesRecord;

  /**
   * Write this filter's value to URL search params.
   * Only writes if the value differs from the default.
   */
  toUrlParams: (state: FilterState, params: URLSearchParams) => void;

  /**
   * Read this filter's value from URL search params.
   * Returns the parsed value if a recognised param is present, or undefined to skip.
   */
  fromUrlParams: (params: URLSearchParams) => FilterState[K] | undefined;
}

/**
 * Union type of all filter modules for use in arrays.
 */
export type AnyFilterModule =
  | FilterModule<FilterId.Search>
  | FilterModule<FilterId.ShowingTitleSearch>
  | FilterModule<FilterId.Categories>
  | FilterModule<FilterId.Venues>
  | FilterModule<FilterId.DateRange>
  | FilterModule<FilterId.Genres>;
