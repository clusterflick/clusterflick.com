import {
  AccessibilityFeature,
  AccessibilityFilterValue,
  ACCESSIBILITY_NONE,
} from "@/types";
import { pruneByPerformances } from "@/utils/prune-movies";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/**
 * Valid accessibility filter values for URL param parsing.
 * Includes all real features plus the "none" sentinel.
 */
const VALID_VALUES = new Set<string>([
  ...Object.values(AccessibilityFeature),
  ACCESSIBILITY_NONE,
]);

/**
 * Checks whether a performance has any accessibility feature enabled.
 */
function hasAnyAccessibilityFeature(
  accessibility: Record<string, boolean> | undefined,
): boolean {
  if (!accessibility) return false;
  return Object.values(accessibility).some(Boolean);
}

/**
 * Accessibility filter module.
 * Filters performances by accessibility features.
 * - `null` = no filter applied (all performances included)
 * - `[]` = no features selected (no performances match)
 * - `[...values]` = only performances matching selected features,
 *   where "none" means performances without any accessibility features
 */
export const accessibilityFilter: FilterModule<FilterId.Accessibility> = {
  id: FilterId.Accessibility,

  getDefault: () => null,

  get: (state: FilterState) => state.accessibility,

  set: (
    state: FilterState,
    value: AccessibilityFilterValue[] | null,
  ): FilterState => ({
    ...state,
    accessibility: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    return !!state.accessibility;
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    const accessibility = state.accessibility;
    if (accessibility) {
      params.set("accessibility", accessibility.join(","));
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (params.has("accessibility")) {
      const values = params
        .get("accessibility")!
        .split(",")
        .map((v) => v.trim())
        .filter((v): v is AccessibilityFilterValue => VALID_VALUES.has(v));
      return values;
    }
    return undefined;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const accessibility = state.accessibility;

    // null/undefined = no filter, include all
    if (!accessibility) {
      return movies;
    }

    // Empty array = none selected, no performances match
    if (accessibility.length === 0) {
      return {};
    }

    const valueSet = new Set(accessibility);
    const includeNone = valueSet.has(ACCESSIBILITY_NONE);

    return pruneByPerformances(movies, (perf) => {
      // Check if this performance has any accessibility features
      if (!hasAnyAccessibilityFeature(perf.accessibility)) {
        // No features — include only if "None" is selected
        return includeNone;
      }

      // Performance has features — check if any match selected features
      return Object.entries(perf.accessibility!).some(
        ([feature, enabled]) =>
          enabled && valueSet.has(feature as AccessibilityFeature),
      );
    });
  },
};
