"use client";

import { useEffect, useMemo, useState } from "react";
import type { NearFilterValue } from "@/lib/filters";
import { createNearValue } from "@/lib/filters";
import {
  DEFAULT_RADIUS_MILES,
  RADIUS_OPTIONS_MILES,
  formatRadiusLabel,
  loadStations,
  parsePlaceRef,
  type Station,
} from "@/lib/places";
import Button from "@/components/button";
import Chip from "@/components/chip";
import EntityQuickAdd, {
  EntityQuickAddItem,
} from "@/components/entity-quick-add";
import styles from "./filter-overlay.module.css";

interface NearFilterSectionProps {
  near: NearFilterValue | null;
  /** Venues a reader can search near: every venue with something showing. */
  venues: { id: string; name: string }[];
  geoLoading: boolean;
  geoError: string | null;
  onChange: (value: NearFilterValue | null) => void;
  /**
   * Find the reader's position, resolving to whether it was found. The section
   * only switches to "near you" once it has been, so a refused prompt leaves
   * the current place alone.
   */
  onRequestLocation: () => Promise<boolean>;
}

/** "½ mile" rather than "half a mile": these are chips, not prose. */
function radiusChipLabel(miles: number): string {
  if (miles === 0.5) return "½ mile";
  return formatRadiusLabel(miles);
}

/**
 * "Near a place": showings within a radius of a station, a venue, or the
 * reader, which need not be where their device is. A visitor plans from where
 * they'll be.
 *
 * One place at a time — picking another replaces it — and a radius the
 * reader chooses, unlike the Near Me venue pill, whose radius grows until it
 * finds ten venues. Combines with the venue pills as "and".
 */
export default function NearFilterSection({
  near,
  venues,
  geoLoading,
  geoError,
  onChange,
  onRequestLocation,
}: NearFilterSectionProps) {
  // Loaded when the overlay opens rather than with the page: only readers
  // searching near somewhere need the station list.
  const [stations, setStations] = useState<Station[] | null>(null);
  const [stationsFailed, setStationsFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadStations()
      .then((loaded) => {
        if (!cancelled) setStations(loaded);
      })
      .catch(() => {
        if (!cancelled) setStationsFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Stations first: they're how most people say where they'll be, and the
  // quick-add keeps the first matches in list order.
  const items = useMemo<EntityQuickAddItem[]>(
    () => [
      ...(stations ?? []).map((station) => ({
        id: `station:${station.slug}`,
        name: `${station.name} station`,
      })),
      ...venues.map((venue) => ({ id: `venue:${venue.id}`, name: venue.name })),
    ],
    [stations, venues],
  );

  // Chosen before a place is, the radius waits here for the place to use.
  const [pendingRadius, setPendingRadius] = useState(DEFAULT_RADIUS_MILES);
  const radius = near?.radiusMiles ?? pendingRadius;
  // So a refused location prompt is explained here, beside the button pressed.
  const [askedForLocation, setAskedForLocation] = useState(false);
  // A link can carry any radius ("within=2km"); show it beside the usual ones
  // rather than leaving no chip checked.
  const radii = useMemo(() => {
    const options: number[] = [...RADIUS_OPTIONS_MILES];
    if (!options.includes(radius)) options.push(radius);
    return options.sort((a, b) => a - b);
  }, [radius]);

  const isHere = near ? parsePlaceRef(near.place)?.kind === "here" : false;

  const pickPlace = (placeId: string) => {
    // Picking the current place again clears it, as toggling a venue does.
    if (near?.place === placeId) {
      onChange(null);
      return;
    }
    const ref = parsePlaceRef(placeId);
    if (ref) onChange(createNearValue(ref, radius));
  };

  const useMyLocation = async () => {
    setAskedForLocation(true);
    if (await onRequestLocation()) {
      onChange(createNearValue({ kind: "here" }, radius));
    }
  };

  return (
    <section className={styles.section} aria-labelledby="near-heading">
      <div className={styles.sectionHeader}>
        <h3 id="near-heading" className={styles.sectionTitle}>
          Near a place
        </h3>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={() => onChange(null)}
            disabled={near === null}
            aria-label="Clear the place"
          >
            Clear
          </Button>
        </div>
      </div>
      <p className={styles.sectionDescription}>
        Search around a station or venue, or where you are now.
      </p>

      {near && (
        <p className={styles.nearSummary} role="status">
          Within {formatRadiusLabel(near.radiusMiles)} of{" "}
          <strong>{near.label ?? "…"}</strong>
          {near.venues !== null && (
            <>
              {" "}
              ·{" "}
              {near.venues.length === 1
                ? "1 venue"
                : `${near.venues.length} venues`}
            </>
          )}
        </p>
      )}

      <div
        className={styles.chipGroup}
        role="radiogroup"
        aria-label="How far from the place"
      >
        {radii.map((miles) => (
          <Chip
            key={miles}
            type="radio"
            name="near-radius"
            label={radiusChipLabel(miles)}
            value={String(miles)}
            checked={radius === miles}
            onChange={(value) => {
              const miles = Number(value);
              if (near) onChange({ ...near, radiusMiles: miles });
              else setPendingRadius(miles);
            }}
          />
        ))}
      </div>

      <EntityQuickAdd
        className={styles.standaloneQuickAdd}
        items={items}
        isSelected={(id) => near?.place === id}
        onToggle={pickPlace}
        inputId="near-place-input"
        placeholder="Search a station or venue…"
        ariaLabel="Search a station or venue"
        pickVerb="choose"
      />
      <Button
        variant="secondary"
        className={styles.venueMapButton}
        onClick={useMyLocation}
        disabled={geoLoading || isHere}
      >
        {geoLoading ? "Locating…" : "Use my location"}
      </Button>
      {stationsFailed && (
        <p className={styles.geoNotice} role="status">
          Stations couldn&apos;t be loaded, but venues can still be searched.
        </p>
      )}
      {(isHere || askedForLocation) && geoError && (
        <p className={styles.geoError} role="alert">
          {geoError}
        </p>
      )}
    </section>
  );
}
