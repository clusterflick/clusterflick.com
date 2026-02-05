"use client";

import { useMemo } from "react";
import { CinemaData, MetaData, Position } from "@/types";
import { getDistanceInMiles, NEARBY_RADIUS_MILES } from "@/utils/geo-distance";
import {
  getCinemaVenueIds,
  getSmallScreeningVenueIds,
} from "@/utils/get-cinema-venue-ids";

export type VenueGroup = {
  id: string;
  label: string;
  venues: { id: string; name: string; count: number }[];
};

type UseVenueGroupsReturn = {
  venueGroups: VenueGroup[];
  allVenueIds: string[];
  cinemaVenueIds: string[];
  smallScreeningVenueIds: string[];
  nearbyVenueIds: string[];
};

/**
 * Hook to compute venue groupings and counts from metadata and movies.
 * Groups venues by chain (for "group" structure) or type (for "solo" structure).
 */
export function useVenueGroups(
  metaData: MetaData | null,
  movies: CinemaData["movies"],
  userPosition: Position | null,
): UseVenueGroupsReturn {
  // Group venues by chain and count movies per venue
  const venueGroups = useMemo(() => {
    if (!metaData?.venues) return [];

    const allVenues = Object.values(metaData.venues);

    // Count movies per venue
    const venueCounts = new Map<string, number>();
    Object.values(movies).forEach((movie) => {
      const venueIds = new Set(
        Object.values(movie.showings).map((s) => s.venueId),
      );
      venueIds.forEach((venueId) => {
        venueCounts.set(venueId, (venueCounts.get(venueId) || 0) + 1);
      });
    });

    // Group venues by groupName (for "group" structure) or type (for "solo" structure)
    const groupMap = new Map<string, VenueGroup>();

    allVenues.forEach((venue) => {
      // Determine the group key and label based on structure
      const groupKey =
        venue.structure === "group" && venue.groupName
          ? `group-${venue.groupName}`
          : `type-${venue.type}`;
      const groupLabel =
        venue.structure === "group" && venue.groupName
          ? venue.groupName
          : venue.type;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: groupKey,
          label: groupLabel,
          venues: [],
        });
      }

      groupMap.get(groupKey)!.venues.push({
        id: venue.id,
        name: venue.name,
        count: venueCounts.get(venue.id) || 0,
      });
    });

    // Sort venues within each group and convert to array
    // Group-structured venues come first (alphabetically), then type-structured venues (alphabetically)
    const groups = Array.from(groupMap.values())
      .map((group) => ({
        ...group,
        venues: group.venues.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => {
        const aIsGroup = a.id.startsWith("group-");
        const bIsGroup = b.id.startsWith("group-");

        // Group-structured venues come first
        if (aIsGroup && !bIsGroup) return -1;
        if (!aIsGroup && bIsGroup) return 1;

        // Within the same category, sort alphabetically
        return a.label.localeCompare(b.label);
      });

    return groups;
  }, [metaData, movies]);

  // All venue IDs for select all functionality
  const allVenueIds = useMemo(() => {
    return venueGroups.flatMap((g) => g.venues.map((v) => v.id));
  }, [venueGroups]);

  // Cinema venue IDs (venues with type "Cinema")
  const cinemaVenueIds = useMemo(() => {
    return getCinemaVenueIds(metaData?.venues);
  }, [metaData]);

  // Small screening venue IDs (venues that are NOT cinemas or concert halls)
  const smallScreeningVenueIds = useMemo(() => {
    return getSmallScreeningVenueIds(metaData?.venues);
  }, [metaData]);

  // Nearby venue IDs (venues within NEARBY_RADIUS_MILES of user's location)
  const nearbyVenueIds = useMemo(() => {
    if (!metaData?.venues || !userPosition) return [];
    return Object.values(metaData.venues)
      .filter((venue) => {
        const distance = getDistanceInMiles(userPosition, venue.geo);
        return distance <= NEARBY_RADIUS_MILES;
      })
      .map((v) => v.id);
  }, [metaData, userPosition]);

  return {
    venueGroups,
    allVenueIds,
    cinemaVenueIds,
    smallScreeningVenueIds,
    nearbyVenueIds,
  };
}
