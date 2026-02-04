// Core types and enums
export { FilterId } from "./types";
export type {
  FilterState,
  MoviesRecord,
  FilterModule,
  AnyFilterModule,
} from "./types";

// Filter modules
export {
  searchFilter,
  categoriesFilter,
  venuesFilter,
  dateRangeFilter,
  genresFilter,
} from "./modules";

// Manager functions and object
export {
  filterManager,
  getDefaultState,
  get,
  set,
  hasActiveFilters,
  getActiveFilterIds,
  apply,
} from "./manager";

// Description utilities
export { describeFilters } from "./describe";
export type { DescribeOptions, FilterDescription } from "./describe";
