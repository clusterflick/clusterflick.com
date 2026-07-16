import { FilterId, FilterState, MoviesRecord, AnyFilterModule } from "./types";
import {
  searchFilter,
  showingTitleSearchFilter,
  showingUrlSearchFilter,
  performanceNotesSearchFilter,
  categoriesFilter,
  venuesFilter,
  dateRangeFilter,
  timeRangeFilter,
  genresFilter,
  accessibilityFilter,
  formatSourceFilter,
  formatPresentationFilter,
  formatDimensionFilter,
  hideFinishedFilter,
} from "./modules";

/**
 * All registered filter modules.
 * Order matters: filters are applied in this order.
 */
const modules: AnyFilterModule[] = [
  searchFilter,
  showingTitleSearchFilter,
  showingUrlSearchFilter,
  performanceNotesSearchFilter,
  categoriesFilter,
  venuesFilter,
  dateRangeFilter,
  timeRangeFilter,
  hideFinishedFilter,
  genresFilter,
  accessibilityFilter,
  formatSourceFilter,
  formatPresentationFilter,
  formatDimensionFilter,
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
 * Creates a fully permissive ("all") filter state where every filter is a no-op.
 *
 * Unlike getDefaultState(), which reflects the `/films` browsing defaults
 * (Films/Multiple/Shorts categories and a today→+7d window), this overrides the
 * two restrictive modules with their true no-filter sentinels. Used as the base
 * for club/festival matchers, where only the matcher itself should constrain
 * results.
 */
export function getPermissiveState(): FilterState {
  return {
    ...getDefaultState(),
    [FilterId.Categories]: null, // all categories, including Events
    [FilterId.DateRange]: { start: null, end: null }, // all dates
  };
}

/**
 * Sanitises an unknown object into a valid FilterState.
 * Any missing or corrupt keys are replaced with their module defaults.
 * This protects against stale session storage, malformed URL params,
 * or future schema changes.
 */
export function sanitizeFilterState(raw: Record<string, unknown>): FilterState {
  const defaults = getDefaultState();
  const state = { ...defaults };

  for (const filterModule of modules) {
    const key = filterModule.id;
    if (key in raw && raw[key] !== undefined) {
      (state as Record<string, unknown>)[key] = raw[key];
    }
    // Otherwise the default from getDefaultState() is already in place
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
 * Structural equality for two filter values. Handles the shapes filter modules
 * store: primitives, `T[] | null` (compared order-independently, since a set of
 * selected categories/venues is the same filter regardless of toggle order),
 * and `{ start, end }` range objects.
 */
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const seen = new Set(a);
    return b.every((value) => seen.has(value));
  }
  if (
    a !== null &&
    b !== null &&
    typeof a === "object" &&
    typeof b === "object"
  ) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((key) =>
      valuesEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }
  return false;
}

/**
 * Whether two filter states are equivalent — i.e. would produce the same
 * results. Compares every registered module's value, so it stays correct as
 * filters are added without any per-key maintenance.
 */
export function statesEqual(a: FilterState, b: FilterState): boolean {
  return modules.every((module) => valuesEqual(module.get(a), module.get(b)));
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
 * The starting point a URL's filter params are applied on top of, chosen by the
 * `base` query param:
 * - `default` (or absent) — the `/films` browsing defaults (Films/Multiple/
 *   Shorts, today→+7d). A deep link is self-contained: dimensions it doesn't
 *   mention fall back to these defaults, never to whatever was in session.
 * - `all` — fully permissive (all categories, all dates); every other dimension
 *   is already permissive by default. Use for "explore everything at X" links.
 * - `patch` — the caller's current state; unmentioned dimensions are preserved.
 *   The one opt-in that amends session state instead of replacing it.
 */
export type FilterBase = "default" | "all" | "patch";

function isFilterBase(value: string | null): value is FilterBase {
  return value === "default" || value === "all" || value === "patch";
}

function getBaseState(
  base: FilterBase,
  currentState: FilterState,
): FilterState {
  switch (base) {
    case "all":
      return getPermissiveState();
    case "patch":
      return currentState;
    default:
      return getDefaultState();
  }
}

/**
 * Whether the URL carries anything that should drive filter state — a valid
 * `base` or any recognised filter param. Used to decide whether to strip the
 * query string on mount.
 */
export function hasUrlFilterParams(search: string): boolean {
  const params = new URLSearchParams(search);
  if (isFilterBase(params.get("base"))) return true;
  return modules.some((m) => m.fromUrlParams(params) !== undefined);
}

/**
 * Resolve a URL's search params into a full FilterState.
 *
 * The `base` param selects the starting state (see {@link FilterBase}); each
 * recognised filter param then overrides its own dimension on top. Because the
 * base sets *every* dimension to a known value, dimensions the URL doesn't
 * mention are reset to the base rather than inherited from session storage.
 *
 * Returns null when the URL carries nothing filter-related, so callers can leave
 * the existing (session) state untouched.
 */
export function resolveFilterStateFromUrl(
  search: string,
  currentState: FilterState,
): FilterState | null {
  const params = new URLSearchParams(search);
  const baseParam = params.get("base");
  const hasBase = isFilterBase(baseParam);

  const overrides: Partial<FilterState> = {};
  let hasOverride = false;
  for (const filterModule of modules) {
    const value = filterModule.fromUrlParams(params);
    if (value !== undefined) {
      (overrides as Record<string, unknown>)[filterModule.id] = value;
      hasOverride = true;
    }
  }

  if (!hasBase && !hasOverride) {
    return null;
  }

  const base = hasBase ? baseParam : "default";
  return { ...getBaseState(base, currentState), ...overrides };
}

/**
 * Build a shareable URL with the current filter state encoded as query params.
 * Only includes params that differ from the defaults.
 */
export function buildFilterUrl(state: FilterState): string {
  const params = new URLSearchParams();

  for (const filterModule of modules) {
    if (filterModule.hasActiveFilter(state)) {
      filterModule.toUrlParams(state, params);
    }
  }

  const query = params.toString();
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return query ? `${base}?${query}` : base;
}

/**
 * The filter manager object - a convenient namespace for all filter operations.
 */
export const filterManager = {
  getDefaultState,
  getPermissiveState,
  sanitizeFilterState,
  get,
  set,
  hasActiveFilters,
  statesEqual,
  apply,
  resolveFilterStateFromUrl,
  hasUrlFilterParams,
  buildFilterUrl,
};
