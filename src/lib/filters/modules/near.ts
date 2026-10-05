import {
  FilterId,
  FilterModule,
  FilterState,
  MoviesRecord,
  NearFilterValue,
} from "../types";
import {
  DEFAULT_RADIUS_MILES,
  formatPlaceRef,
  formatRadius,
  parsePlaceRef,
  parseRadius,
  type PlaceRef,
} from "@/lib/places";
import { pruneByShowings } from "@/utils/prune-movies";

export const NEAR_URL_PARAM = "near";
export const RADIUS_URL_PARAM = "within";

/**
 * A fresh, unresolved value for a place: `NearFilterSync` fills in its label
 * and venues once it knows where the place is.
 */
export function createNearValue(
  place: PlaceRef,
  radiusMiles: number = DEFAULT_RADIUS_MILES,
): NearFilterValue {
  return {
    place: formatPlaceRef(place),
    radiusMiles,
    label: null,
    venues: null,
  };
}

/**
 * Near filter module: showings at venues within a radius of a place, which
 * need not be where the reader is — a visitor plans from where they'll be.
 *
 * The URL holds the place, not its venues (`?near=station:kings-cross&within=1mi`),
 * so a link follows the dataset: a venue that opens within the radius is in
 * it next time, as a club filter follows its programme. The venues are worked
 * out on the reader's device (`NearFilterSync`) and kept in the state, since
 * the pipeline has no coordinates of its own.
 *
 * Until they are, it matches nothing: everything would claim to be nearby.
 * It combines with the venue filter as "and", so "cinemas near King's Cross"
 * is the Cinemas preset plus a place.
 */
export const nearFilter: FilterModule<FilterId.Near> = {
  id: FilterId.Near,

  getDefault: () => null,

  get: (state: FilterState) => state.near,

  set: (state: FilterState, value: NearFilterValue | null): FilterState => ({
    ...state,
    near: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => state.near !== null,

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    const near = state.near;
    if (!near) return;
    params.set(NEAR_URL_PARAM, near.place);
    params.set(RADIUS_URL_PARAM, formatRadius(near.radiusMiles));
  },

  fromUrlParams: (params: URLSearchParams) => {
    const raw = params.get(NEAR_URL_PARAM);
    if (raw === null) return undefined;
    // `near=` with nothing after it is the way to clear it in a patch link.
    if (raw.trim() === "") return null;
    const place = parsePlaceRef(raw);
    if (!place) return undefined;
    const within = params.get(RADIUS_URL_PARAM);
    const radius = (within && parseRadius(within)) || DEFAULT_RADIUS_MILES;
    return createNearValue(place, radius);
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const near = state.near;
    if (!near) return movies;
    if (!near.venues || near.venues.length === 0) return {};
    const venueSet = new Set(near.venues);
    return pruneByShowings(movies, (showing) => venueSet.has(showing.venueId));
  },
};
