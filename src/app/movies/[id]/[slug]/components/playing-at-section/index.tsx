"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Venue } from "@/types";
import { useGeolocationContext } from "@/state/geolocation-context";
import { getDistanceInMiles } from "@/utils/geo-distance";
import { getVenueUrl } from "@/utils/get-venue-url";
import PillList from "@/components/pill-list";
import Button from "@/components/button";
import { MapPinIcon } from "@/components/icons";
import VenueMapDialog, {
  type VenueMapDialogVenue,
} from "@/components/venue-map-dialog";
import styles from "./playing-at-section.module.css";

const MAX_VISIBLE_MOBILE = 2;
const MAX_VISIBLE_DESKTOP = 3;

/**
 * Per-venue screening count for a movie, precomputed at build time so the
 * "Playing at" summary can be statically rendered without shipping the full
 * (chunked) performance data to the client.
 */
export interface VenuePlayCount {
  venueId: string;
  count: number;
}

interface PlayingAtSectionProps {
  venueCounts: VenuePlayCount[];
  venues: Record<string, Venue>;
}

interface VenueEntry {
  venue: Venue;
  count: number;
  distance: number | null;
}

function formatShowings(count: number): string {
  return `${count} showing${count === 1 ? "" : "s"}`;
}

function formatMeta(entry: VenueEntry): string {
  if (entry.distance !== null) {
    return entry.distance < 0.05
      ? "< 0.1 miles"
      : `${entry.distance.toFixed(1)} miles`;
  }
  return formatShowings(entry.count);
}

export default function PlayingAtSection({
  venueCounts,
  venues,
}: PlayingAtSectionProps) {
  const { position } = useGeolocationContext();
  const [isMapOpen, setIsMapOpen] = useState(false);

  const entries = useMemo<VenueEntry[]>(() => {
    const result: VenueEntry[] = [];
    for (const { venueId, count } of venueCounts) {
      const venue = venues[venueId];
      if (!venue) continue;
      result.push({
        venue,
        count,
        distance: position ? getDistanceInMiles(position, venue.geo) : null,
      });
    }

    // With a known location, sort nearest-first; otherwise most showings first
    // (falling back to venue name for stable ordering). Position is null during
    // static render / hydration, so the prerendered HTML is always count-sorted.
    result.sort((a, b) => {
      if (position) return (a.distance ?? 0) - (b.distance ?? 0);
      if (b.count !== a.count) return b.count - a.count;
      return a.venue.name.localeCompare(b.venue.name);
    });

    return result;
  }, [venueCounts, venues, position]);

  const mapVenues = useMemo<VenueMapDialogVenue[]>(
    () =>
      entries.map(({ venue, count }) => ({
        id: venue.id,
        name: venue.name,
        href: getVenueUrl(venue),
        type: venue.type,
        lat: venue.geo.lat,
        lon: venue.geo.lon,
        filmCount: count,
        detail: formatShowings(count),
      })),
    [entries],
  );

  if (entries.length === 0) return null;

  return (
    <div className={styles.section}>
      <PillList
        title="Playing at"
        itemNoun="venues"
        items={entries}
        maxVisible={MAX_VISIBLE_DESKTOP}
        maxVisibleMobile={MAX_VISIBLE_MOBILE}
        renderItem={(entry) => (
          <>
            <Link href={getVenueUrl(entry.venue)}>{entry.venue.name}</Link>
            <span className={styles.meta}>{formatMeta(entry)}</span>
          </>
        )}
      />
      <Button
        variant="secondary"
        size="sm"
        className={styles.mapButton}
        onClick={() => setIsMapOpen(true)}
      >
        <MapPinIcon size={16} />
        See on a map
      </Button>
      {isMapOpen && (
        <VenueMapDialog
          title="Where it's playing"
          summary={`Showing at ${entries.length} ${
            entries.length === 1 ? "venue" : "venues"
          }`}
          venues={mapVenues}
          onClose={() => setIsMapOpen(false)}
        />
      )}
    </div>
  );
}
