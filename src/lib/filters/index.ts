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
  directorsFilter,
  castFilter,
  PEOPLE_GROUPS,
  getPeopleVocabulary,
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
  PeopleFilterId,
  PeopleGroupConfig,
  PersonOption,
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

// Zero-result suggestions
export { suggestFilterRelaxations } from "./suggest";
export type {
  FilterSuggestion,
  SuggestionChange,
  SuggestionKind,
  SuggestOptions,
} from "./suggest";
