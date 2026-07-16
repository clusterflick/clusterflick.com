import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { pruneByShowings } from "@/utils/prune-movies";

/**
 * Venues filter module.
 * Filters movies by venue IDs, also filters performances within each movie.
 * - `null` = no filter (all venues included)
 * - `[]` = no venues selected (no movies match)
 */
export const venuesFilter: FilterModule<FilterId.Venues> = {
  id: FilterId.Venues,

  getDefault: () => null,

  get: (state: FilterState) => state.venues,

  set: (state: FilterState, value: string[] | null): FilterState => ({
    ...state,
    venues: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    return !!state.venues;
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    const venues = state.venues;
    if (venues === null) {
      params.set("venues", "all");
    } else if (venues.length === 0) {
      params.set("venues", "none");
    } else {
      params.set("venues", venues.join(","));
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (!params.has("venues")) {
      return undefined;
    }
    const raw = params.get("venues")!.trim();
    if (raw === "all") return null;
    if (raw === "none") return [];
    return raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const venues = state.venues;

    // null/undefined = no filter, include all
    if (!venues) {
      return movies;
    }

    // Empty array = none selected, no movies match
    if (venues.length === 0) {
      return {};
    }

    const venueSet = new Set(venues);
    return pruneByShowings(movies, (showing) => venueSet.has(showing.venueId));
  },
};
