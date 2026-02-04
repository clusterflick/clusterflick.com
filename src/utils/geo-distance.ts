import { Position } from "@/types";

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
 * Default radius in miles for "nearby" venue detection
 */
export const NEARBY_RADIUS_MILES = 2;
