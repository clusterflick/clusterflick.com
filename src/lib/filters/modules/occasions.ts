import {
  OccasionType,
  OCCASION_NONE,
  type MoviePerformanceOccasions,
  type OccasionFilterValue,
} from "@/types";
import { pruneByPerformances } from "@/utils/prune-movies";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/** Valid values for URL param parsing: every kind plus the "none" sentinel. */
const VALID_VALUES = new Set<string>([
  ...Object.values(OccasionType),
  OCCASION_NONE,
]);

function hasAnyOccasion(
  occasions: MoviePerformanceOccasions | undefined,
): boolean {
  return !!occasions && Object.values(occasions).some(Boolean);
}

/**
 * Occasions filter module: what makes a performance more than a screening,
 * as the pipeline publishes it in `performance.occasions`. The accessibility
 * filter over again, one value per kind:
 * - `null` = no filter applied (all performances included)
 * - `[]` = nothing selected (no performances match)
 * - `[...values]` = performances with any selected kind, where "none" means
 *   performances with no occasion at all
 *
 * Every kind is listed, not just the ones the home page judges rare - as with
 * the performance tags, it is a fact about one showing.
 */
export const occasionsFilter: FilterModule<FilterId.Occasions> = {
  id: FilterId.Occasions,

  getDefault: () => null,

  get: (state: FilterState) => state.occasions,

  set: (state: FilterState, value: OccasionFilterValue[] | null) => ({
    ...state,
    occasions: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => !!state.occasions,

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    const occasions = state.occasions;
    if (occasions === null) {
      params.set("occasions", "all");
    } else if (occasions.length === 0) {
      params.set("occasions", "none");
    } else {
      params.set("occasions", occasions.join(","));
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (!params.has("occasions")) return undefined;
    const raw = params.get("occasions")!.trim();
    if (raw === "all") return null;
    if (raw === "none") return [];
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is OccasionFilterValue => VALID_VALUES.has(value));
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const occasions = state.occasions;
    if (!occasions) return movies;
    if (occasions.length === 0) return {};

    const selected = new Set<string>(occasions);
    const includeNone = selected.has(OCCASION_NONE);

    return pruneByPerformances(movies, (performance) => {
      if (!hasAnyOccasion(performance.occasions)) return includeNone;
      return Object.entries(performance.occasions!).some(
        ([kind, value]) => !!value && selected.has(kind),
      );
    });
  },
};
