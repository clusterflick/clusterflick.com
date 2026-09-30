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
  letterboxdRatingFilter,
  getHighlyRatedUrl,
  HIGHLY_RATED_MIN_LETTERBOXD,
  LETTERBOXD_RATING_MIN,
  LETTERBOXD_RATING_MAX,
  LETTERBOXD_RATING_STEP,
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
} from "./modules";

// Manager functions and object
export {
  filterManager,
  getDefaultState,
  getPermissiveState,
  matchAny,
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
