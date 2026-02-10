import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getVenueUrl } from "@/utils/get-venue-url";
import type { Venue } from "@/types";
import VenuesPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Venues",
  description:
    "Browse all cinema venues across London tracked by Clusterflick. From major chains like Curzon, Everyman and Picturehouse to independent cinemas, arts centres and pop-up screenings.",
};

export type VenueGroupData = {
  id: string;
  label: string;
  venues: {
    name: string;
    displayName: string;
    href: string;
    eventCount: number;
  }[];
};

function buildVenueGroups(
  venues: Record<string, Venue>,
  eventCounts: Map<string, number>,
): VenueGroupData[] {
  const groupMap = new Map<
    string,
    {
      id: string;
      label: string;
      venues: (Venue & {
        displayName: string;
        href: string;
        eventCount: number;
      })[];
    }
  >();

  for (const venue of Object.values(venues)) {
    const groupKey =
      venue.structure === "group" && venue.groupName
        ? `group-${venue.groupName}`
        : `type-${venue.type}`;
    const groupLabel =
      venue.structure === "group" && venue.groupName
        ? venue.groupName
        : venue.type;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { id: groupKey, label: groupLabel, venues: [] });
    }

    const isGroupStructured = groupKey.startsWith("group-");
    let displayName = venue.name;
    if (isGroupStructured) {
      const prefixPattern = new RegExp(`^${groupLabel}\\s*`, "i");
      displayName = venue.name.replace(prefixPattern, "").trim() || venue.name;
    }

    groupMap.get(groupKey)!.venues.push({
      ...venue,
      displayName,
      href: getVenueUrl(venue),
      eventCount: eventCounts.get(venue.id) || 0,
    });
  }

  return Array.from(groupMap.values())
    .map((group) => ({
      id: group.id,
      label: group.label === "Unknown" ? "Other" : group.label,
      venues: group.venues
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name, displayName, href, eventCount }) => ({
          name,
          displayName,
          href,
          eventCount,
        })),
    }))
    .sort((a, b) => {
      const aIsGroup = a.id.startsWith("group-");
      const bIsGroup = b.id.startsWith("group-");
      if (aIsGroup && !bIsGroup) return -1;
      if (!aIsGroup && bIsGroup) return 1;
      return a.label.localeCompare(b.label);
    });
}

export default async function VenuesPage() {
  const data = await getStaticData();

  // Count movies per venue
  const eventCounts = new Map<string, number>();
  for (const movie of Object.values(data.movies)) {
    const venueIds = new Set<string>();
    for (const showing of Object.values(movie.showings)) {
      venueIds.add(showing.venueId);
    }
    for (const venueId of venueIds) {
      eventCounts.set(venueId, (eventCounts.get(venueId) || 0) + 1);
    }
  }

  const groups = buildVenueGroups(data.venues, eventCounts);
  const totalVenues = Object.keys(data.venues).length;

  return <VenuesPageContent groups={groups} totalVenues={totalVenues} />;
}
