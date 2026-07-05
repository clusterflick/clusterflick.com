import { Position, Venue } from "@/types";

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula.
 * @param from - The starting position with lat and lon
 * @param to - The destination position with lat and lon
 * @returns Distance in miles
 */
export function getDistanceInMiles(from: Position, to: Position): number {
  const R = 3959; // Earth's radius in miles

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLon = ((to.lon - from.lon) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Fixed radius in miles used by the standalone "/near-me" page, which lists
 * cinemas with their exact distances under a "within 2 miles" label. The
 * adaptive filter-chip logic below does not use this.
 */
export const NEARBY_RADIUS_MILES = 2;

/**
 * Starting radius in miles for "nearby" venue detection. Everything within this
 * radius is always included.
 */
export const NEARBY_BASE_RADIUS_MILES = 0.5;

/**
 * Minimum number of venues "nearby" should aim to return. When the base radius
 * is too sparse, the radius expands until this floor is met (or the ceiling is
 * reached). The floor may be exceeded — expansion is by radius, not by count.
 */
export const NEARBY_MIN_VENUES = 10;

/**
 * Hard upper bound in miles for "nearby" venue detection. Venues beyond this are
 * never included, even if the floor has not been met.
 */
export const NEARBY_MAX_RADIUS_MILES = 2;

/**
 * Step in miles by which the radius grows when topping up to the floor.
 */
export const NEARBY_RADIUS_STEP_MILES = 0.1;

/**
 * Compute the set of venue IDs considered "nearby" the given position.
 *
 * Only venues that actually have showings (see {@link venueIdsWithShowings})
 * are ever considered — a nearby bar with nothing on is useless as a filter, so
 * it neither counts toward the floor nor appears in the result.
 *
 * Starts at {@link NEARBY_BASE_RADIUS_MILES} and grows the radius in steps of
 * {@link NEARBY_RADIUS_STEP_MILES} until at least {@link NEARBY_MIN_VENUES}
 * venues-with-showings are within range, or the radius reaches
 * {@link NEARBY_MAX_RADIUS_MILES}. All qualifying venues within the final radius
 * are returned (so the result may exceed the floor), keeping the boundary
 * geographically honest rather than slicing a sorted list. If nothing with
 * showings falls within the ceiling, the result is empty.
 */
export function getNearbyVenueIds(
  from: Position,
  venues: Venue[],
  venueIdsWithShowings: Set<string>,
): string[] {
  const distances = venues
    .filter((venue) => venueIdsWithShowings.has(venue.id))
    .map((venue) => ({
      id: venue.id,
      distance: getDistanceInMiles(from, venue.geo),
    }));

  let radius = NEARBY_BASE_RADIUS_MILES;
  let withinRadius = distances.filter((v) => v.distance <= radius);

  while (
    withinRadius.length < NEARBY_MIN_VENUES &&
    radius < NEARBY_MAX_RADIUS_MILES
  ) {
    radius = Math.min(
      radius + NEARBY_RADIUS_STEP_MILES,
      NEARBY_MAX_RADIUS_MILES,
    );
    withinRadius = distances.filter((v) => v.distance <= radius);
  }

  return withinRadius.map((v) => v.id);
}
