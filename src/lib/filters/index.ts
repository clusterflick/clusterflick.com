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
  showingTitleSearchFilter,
  performanceNotesSearchFilter,
  categoriesFilter,
  venuesFilter,
  dateRangeFilter,
  genresFilter,
  formatSourceFilter,
  formatPresentationFilter,
  formatDimensionFilter,
  FORMAT_GROUPS,
  getEffectiveFormatValue,
  getPrimaryCategory,
} from "./modules";
export type {
  FormatFilterId,
  FormatGroupConfig,
  FormatOption,
} from "./modules";

// Manager functions and object
export {
  filterManager,
  getDefaultState,
  getPermissiveState,
  get,
  set,
  hasActiveFilters,
  getActiveFilterIds,
  apply,
  resolveFilterStateFromUrl,
  hasUrlFilterParams,
  buildFilterUrl,
} from "./manager";
export type { FilterBase } from "./manager";

// Description utilities
export { describeFilters } from "./describe";
export type { DescribeOptions, FilterDescription } from "./describe";
