import type { Venue } from "@/types";
import { getDistanceInMiles } from "@/utils/geo-distance";
import { LONDON_BOROUGHS, type LondonBorough } from "@/data/london-boroughs";

/**
 * Find which borough a venue belongs to based on proximity to borough center.
 * Returns the nearest borough whose radius contains the venue, or null.
 */
export function getVenueBorough(venue: Venue): LondonBorough | null {
  let bestMatch: LondonBorough | null = null;
  let bestDistance = Infinity;

  for (const borough of LONDON_BOROUGHS) {
    const distance = getDistanceInMiles(venue.geo, borough.center);
    if (distance <= borough.radiusMiles && distance < bestDistance) {
      bestMatch = borough;
      bestDistance = distance;
    }
  }

  return bestMatch;
}

/**
 * Group all venues by borough. A venue is assigned to the nearest borough
 * center within that borough's radius. Venues outside all boroughs are excluded.
 */
export function groupVenuesByBorough(
  venues: Record<string, Venue>,
): Map<string, Venue[]> {
  const map = new Map<string, Venue[]>();

  for (const venue of Object.values(venues)) {
    const borough = getVenueBorough(venue);
    if (!borough) continue;

    if (!map.has(borough.slug)) {
      map.set(borough.slug, []);
    }
    map.get(borough.slug)!.push(venue);
  }

  return map;
}
