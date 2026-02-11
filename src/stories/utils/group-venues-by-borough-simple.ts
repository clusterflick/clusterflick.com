import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { getDistanceInMiles } from "@/utils/geo-distance";
import type { Venue } from "@/types";

/**
 * Simple center+radius venue grouping for browser/Storybook use.
 * The real pages use GeoJSON boundary data which requires Node.js fs access.
 */
export function groupVenuesByBoroughSimple(
  venues: Record<string, Venue>,
): Map<string, Venue[]> {
  const map = new Map<string, Venue[]>();
  for (const venue of Object.values(venues)) {
    let bestSlug: string | null = null;
    let bestDistance = Infinity;
    for (const borough of LONDON_BOROUGHS) {
      const distance = getDistanceInMiles(venue.geo, borough.center);
      if (distance <= borough.radiusMiles && distance < bestDistance) {
        bestSlug = borough.slug;
        bestDistance = distance;
      }
    }
    if (bestSlug) {
      if (!map.has(bestSlug)) map.set(bestSlug, []);
      map.get(bestSlug)!.push(venue);
    }
  }
  return map;
}
