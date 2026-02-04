import { FilterId, FilterState, MoviesRecord, AnyFilterModule } from "./types";
import {
  searchFilter,
  categoriesFilter,
  venuesFilter,
  dateRangeFilter,
  genresFilter,
} from "./modules";

/**
 * All registered filter modules.
 * Order matters: filters are applied in this order.
 */
const modules: AnyFilterModule[] = [
  searchFilter,
  categoriesFilter,
  venuesFilter,
  dateRangeFilter,
  genresFilter,
];

/**
 * Finds a module by its id.
 */
function getModule<K extends FilterId>(id: K): AnyFilterModule {
  const filterModule = modules.find((m) => m.id === id);
  if (!filterModule) {
    throw new Error(`Filter module not found: ${id}`);
  }
  return filterModule;
}

/**
 * Creates the default filter state with no filters applied.
 */
export function getDefaultState(): FilterState {
  const state = {} as FilterState;
  for (const filterModule of modules) {
    (state as Record<string, unknown>)[filterModule.id] =
      filterModule.getDefault();
  }
  return state;
}

/**
 * Gets a filter value from the state.
 *
 * Note: The `as FilterState[K]` cast is needed because getModule returns
 * AnyFilterModule (a union type), and TypeScript can't narrow the return
 * type based on the generic K. Type safety is enforced at call sites via
 * the generic constraint.
 */
export function get<K extends FilterId>(
  state: FilterState,
  id: K,
): FilterState[K] {
  return getModule(id).get(state) as FilterState[K];
}

/**
 * Sets a filter value, returning a new state.
 *
 * Note: The `as never` cast is needed because getModule returns AnyFilterModule
 * (a union type), and TypeScript can't verify that `value` matches the specific
 * module's expected type. Type safety is enforced at call sites - the generic K
 * ensures callers pass the correct value type for the given filter id.
 */
export function set<K extends FilterId>(
  state: FilterState,
  id: K,
  value: FilterState[K],
): FilterState {
  return getModule(id).set(state, value as never);
}

/**
 * Checks if any filter is actively filtering.
 */
export function hasActiveFilters(state: FilterState): boolean {
  return modules.some((module) => module.hasActiveFilter(state));
}

/**
 * Gets the IDs of all active filters.
 */
export function getActiveFilterIds(state: FilterState): FilterId[] {
  return modules
    .filter((module) => module.hasActiveFilter(state))
    .map((module) => module.id);
}

/**
 * Applies all filters to the movies data.
 * Filters are applied in order, each receiving the output of the previous.
 * Returns a new movies record with filtering applied.
 */
export function apply(movies: MoviesRecord, state: FilterState): MoviesRecord {
  let result = movies;

  for (const filterModule of modules) {
    result = filterModule.apply(result, state);
  }

  return result;
}

/**
 * The filter manager object - a convenient namespace for all filter operations.
 */
export const filterManager = {
  getDefaultState,
  get,
  set,
  hasActiveFilters,
  apply,
};
