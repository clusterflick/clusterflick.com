// Core types and enums
export { FilterId } from "./types";
export type {
  FilterState,
  MoviesRecord,
  FilterModule,
  AnyFilterModule,
  NearFilterValue,
} from "./types";

// Filter modules
export {
  searchFilter,
  showingTitleSearchFilter,
  performanceNotesSearchFilter,
  categoriesFilter,
  venuesFilter,
  nearFilter,
  createNearValue,
  NEAR_URL_PARAM,
  RADIUS_URL_PARAM,
  dateRangeFilter,
  genresFilter,
  RATING_GROUPS,
  getRatingGroup,
  meetsRating,
  getHighlyRatedUrl,
  directorsFilter,
  castFilter,
  PEOPLE_GROUPS,
  getPeopleVocabulary,
  buildPeopleIndex,
  resolvePeopleQuery,
  moviesFilter,
  getMovieVocabulary,
  getMoviesFilterUrl,
  PROGRAMME_GROUPS,
  getProgrammeName,
  getProgrammeFilterUrl,
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
  PeopleIndex,
  MovieOption,
  ProgrammeFilterId,
  ProgrammeGroupConfig,
  Programme,
  RatingFilterId,
  RatingGroupConfig,
} from "./modules";

// Manager functions and object
export {
  filterManager,
  getDefaultState,
  getPermissiveState,
  keepPersonalFilters,
  matchAny,
  get,
  set,
  hasActiveFilters,
  getActiveFilterIds,
  getRestrictiveFilterIds,
  getChangedFilterIds,
  filtersAtDefault,
  widenFilters,
  apply,
  resolveFilterStateFromUrl,
  hasUrlFilterParams,
  buildFilterUrl,
} from "./manager";
export type { FilterBase } from "./manager";

// Description utilities
export { describeFilters, describeFilterChips } from "./describe";
export type {
  DescribeOptions,
  FilterDescription,
  FilterChip,
} from "./describe";

// The filter overlay's search menu
export {
  buildFilterSearchGroups,
  searchFilterGroups,
  prepareFilterSearch,
  isFilterSearchEntrySelected,
  applyFilterSearchEntry,
  MIN_FILTER_SEARCH_LENGTH,
} from "./filter-search";
export type { FilterSearchEntry, FilterSearchSources } from "./filter-search";

// Thin-result notice
export { getHiddenByDate, THIN_RESULT_LIMIT } from "./hidden-by-date";
export type { HiddenByDate } from "./hidden-by-date";

// Zero-result suggestions
export {
  suggestFilterRelaxations,
  suggestShowingRelaxations,
  getFilterValueOffers,
} from "./suggest";
export type {
  FilterSuggestion,
  SuggestionChange,
  SuggestionKind,
  SuggestOptions,
  ShowingSuggestOptions,
  FilterValueOfferOptions,
} from "./suggest";
