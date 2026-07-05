import type { Venue } from "@/types";
import { VENUE_GROUPS } from "@/data/venue-groups";

/**
 * Group registered cinema-chain venues by their group slug.
 *
 * Only venues whose `groupName` matches a `VENUE_GROUPS` entry are included, so
 * hotels, universities and other non-cinema "groups" are excluded. Venues within
 * each group are sorted by name. Mirrors `groupVenuesByBorough`.
 */
export function groupVenuesByGroup(
  venues: Record<string, Venue>,
): Map<string, Venue[]> {
  const slugByGroupName = new Map(
    VENUE_GROUPS.map((group) => [group.groupName, group.slug]),
  );

  const map = new Map<string, Venue[]>();

  for (const venue of Object.values(venues)) {
    if (venue.structure !== "group" || !venue.groupName) continue;
    const slug = slugByGroupName.get(venue.groupName);
    if (!slug) continue;

    if (!map.has(slug)) {
      map.set(slug, []);
    }
    map.get(slug)!.push(venue);
  }

  for (const groupVenues of map.values()) {
    groupVenues.sort((a, b) => a.name.localeCompare(b.name));
  }

  return map;
}
