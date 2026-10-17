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

/** A short distance label for a nearby venue: "0.4 mi", or "< 0.1 mi". */
export function formatShortDistance(miles: number): string {
  return miles < 0.1 ? "< 0.1 mi" : `${miles.toFixed(1)} mi`;
}

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
 * The grid the "nearby" radius is worked out on, in degrees: about 500m a side
 * in London, where a degree of longitude is ~0.62 of a degree of latitude. The
 * grid is fixed — it never moves with the reader — so the same place always
 * gets the same radius.
 */
export const NEARBY_AREA_CELL_LAT = 0.0045;
export const NEARBY_AREA_CELL_LON = 0.0072;

/**
 * The radius the floor rule settles on at exactly `point`: half a mile, grown
 * in steps until {@link NEARBY_MIN_VENUES} venues are inside, up to the
 * ceiling.
 */
function getFloorRadiusAt(
  point: Position,
  venues: Pick<Venue, "geo">[],
): number {
  const distances = venues.map((venue) => getDistanceInMiles(point, venue.geo));
  const countWithin = (radius: number) =>
    distances.filter((distance) => distance <= radius).length;

  let radius = NEARBY_BASE_RADIUS_MILES;
  while (
    countWithin(radius) < NEARBY_MIN_VENUES &&
    radius < NEARBY_MAX_RADIUS_MILES
  ) {
    radius = Math.min(
      radius + NEARBY_RADIUS_STEP_MILES,
      NEARBY_MAX_RADIUS_MILES,
    );
  }
  return radius;
}

/**
 * The "nearby" radius around `from`: the floor rule worked out at the centres
 * of the four grid cells nearest it, blended by how close `from` is to each.
 *
 * Worked out at `from` itself, the floor rule jumps a whole step when the
 * tenth venue crosses its line, and a few metres of GPS drift was enough: two
 * windows 30m apart in Shoreditch stopped at 0.5 and 0.6 miles, one with
 * Curzon Hoxton and one without, 2 films today against 9. Blended, the radius
 * moves by hundredths of a mile as the reader does, so a venue comes or goes
 * only when it is itself on the edge. Measured over 1,500 points in zones 1–2,
 * moving 30m changed today's films by three or more at 8.4% of them, and 4.1%
 * blended, with the same number of films found.
 *
 * Each corner is still the floor rule, so the radius stays between half a mile
 * and the ceiling and still widens where venues are sparse. What it no longer
 * promises is ten venues at the reader's exact spot: it is the radius their
 * area needs, so a reader can get a few more than ten, or a few fewer.
 */
export function getNearbyRadius(
  from: Position,
  venues: Pick<Venue, "geo">[],
): number {
  const y = from.lat / NEARBY_AREA_CELL_LAT - 0.5;
  const x = from.lon / NEARBY_AREA_CELL_LON - 0.5;
  const row = Math.floor(y);
  const column = Math.floor(x);
  const ty = y - row;
  const tx = x - column;

  const radiusAtCentre = (r: number, c: number) =>
    getFloorRadiusAt(
      {
        lat: (r + 0.5) * NEARBY_AREA_CELL_LAT,
        lon: (c + 0.5) * NEARBY_AREA_CELL_LON,
      },
      venues,
    );

  return (
    radiusAtCentre(row, column) * (1 - ty) * (1 - tx) +
    radiusAtCentre(row + 1, column) * ty * (1 - tx) +
    radiusAtCentre(row, column + 1) * (1 - ty) * tx +
    radiusAtCentre(row + 1, column + 1) * ty * tx
  );
}

/**
 * Compute the set of venue IDs considered "nearby" the given position.
 *
 * Only venues that actually have showings (see {@link venueIdsWithShowings})
 * are ever considered — a nearby bar with nothing on is useless as a filter, so
 * it neither counts toward the floor nor appears in the result.
 *
 * Every qualifying venue within {@link getNearbyRadius} of `from` is returned,
 * keeping the boundary geographically honest rather than slicing a sorted
 * list. If nothing with showings falls within it, the result is empty.
 */
export function getNearbyVenueIds(
  from: Position,
  venues: Pick<Venue, "id" | "geo">[],
  venueIdsWithShowings: Set<string>,
): string[] {
  const candidates = venues.filter((venue) =>
    venueIdsWithShowings.has(venue.id),
  );
  const radius = getNearbyRadius(from, candidates);
  return candidates
    .filter((venue) => getDistanceInMiles(from, venue.geo) <= radius)
    .map((venue) => venue.id);
}
