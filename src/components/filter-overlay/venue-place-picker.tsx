"use client";

import { Ref, useEffect, useMemo, useState } from "react";
import type { Position, Venue } from "@/types";
import {
  DEFAULT_RADIUS,
  RADIUS_OPTIONS,
  describeVenueOrigin,
  formatPlaceRef,
  formatRadiusLabel,
  getVenueIdsNear,
  loadStations,
  parsePlaceRef,
  resolvePlace,
  type PlaceRadius,
  type PlaceRef,
  type Station,
  type VenueOrigin,
} from "@/lib/places";
import { NEARBY_MAX_RADIUS_MILES } from "@/utils/geo-distance";
import Button from "@/components/button";
import Chip from "@/components/chip";
import EntityQuickAdd, {
  EntityQuickAddHandle,
  EntityQuickAddItem,
} from "@/components/entity-quick-add";
import styles from "./filter-overlay.module.css";

interface VenuePlacePickerProps {
  /** The place the current selection was picked from, while it still is. */
  origin: VenueOrigin | null;
  /** Every venue with something showing: what a place can pick from. */
  venues: Pick<Venue, "id" | "name" | "geo">[];
  geoLoading: boolean;
  geoError: string | null;
  /** Select these venues, remembering where they were picked from. */
  onPick: (origin: VenueOrigin) => void;
  /** Find the reader's position, or null if it can't be had. */
  onRequestLocation: () => Promise<Position | null>;
  /** Handle for the place search, so the "Near a Place" pill can focus it. */
  inputRef?: Ref<EntityQuickAddHandle>;
}

/** The widest radius offered, past which there's nothing wider to suggest. */
const WIDEST_RADIUS_MILES = Math.max(
  ...RADIUS_OPTIONS.filter((option): option is number => option !== "auto"),
);

/** A place that has been looked up, which a new radius can reuse. */
type Draft = { place: string; label: string; point: Position };

/** "½ mile" rather than "half a mile": these are chips, not prose. */
function radiusChipLabel(radius: PlaceRadius): string {
  if (radius === "auto") return "Auto";
  if (radius === 0.5) return "½ mile";
  return formatRadiusLabel(radius);
}

/**
 * Picks the venues around the reader, a station or a venue, which need not be
 * where their device is: a visitor plans from where they'll be.
 *
 * What it produces is an ordinary venue selection — a shared link carries the
 * venues and nothing else. The place and radius are remembered beside it
 * (`VenueOrigin`), so while the selection is still what they picked, this
 * shows them and changing either picks again without starting over.
 *
 * The radius defaults to Auto, the rule Venues Near Me used: half a mile,
 * widened until there are ten venues. A number is the reader's and never
 * grows. A pick that finds nothing leaves the selection alone and says so,
 * keeping the place for a wider radius.
 */
export default function VenuePlacePicker({
  origin,
  venues,
  geoLoading,
  geoError,
  onPick,
  onRequestLocation,
  inputRef,
}: VenuePlacePickerProps) {
  // Loaded when the picker first shows rather than with the page: only
  // readers picking near somewhere need the station list.
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

  const venueLookup = useMemo(
    () => Object.fromEntries(venues.map((venue) => [venue.id, venue])),
    [venues],
  );

  // A place looked up but not applied, because it found nothing: kept so a
  // wider radius can try it again.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [radius, setRadius] = useState<PlaceRadius>(
    origin?.radius ?? DEFAULT_RADIUS,
  );
  const [notice, setNotice] = useState<string | null>(null);
  // So a refused location prompt is explained here, beside the button pressed.
  const [askedForLocation, setAskedForLocation] = useState(false);

  // The place on show: the applied one, else one that found nothing.
  const current: Draft | null = origin ?? draft;
  const shownRadius = origin?.radius ?? radius;

  // Stations first: they're how most people say where they'll be, and the
  // search keeps the first matches in list order.
  const items = useMemo<EntityQuickAddItem[]>(
    () => [
      ...(stations ?? []).map((station) => ({
        id: `station:${station.slug}`,
        name: `${station.name} station`,
      })),
      ...[...venues]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((venue) => ({ id: `venue:${venue.id}`, name: venue.name })),
    ],
    [stations, venues],
  );

  const pick = (place: Draft, radius: PlaceRadius) => {
    setRadius(radius);
    const ids = getVenueIdsNear(place.point, radius, venueLookup);
    if (ids.length === 0) {
      setDraft(place);
      const miles = radius === "auto" ? NEARBY_MAX_RADIUS_MILES : radius;
      setNotice(
        `Nothing is showing within ${formatRadiusLabel(miles)} of ${place.label}.` +
          (miles < WIDEST_RADIUS_MILES ? " Try a wider radius." : ""),
      );
      return;
    }
    setDraft(null);
    setNotice(null);
    onPick({ ...place, radius, venues: ids });
  };

  const pickPlace = (ref: PlaceRef, position: Position | null = null) => {
    const resolved = resolvePlace(ref, {
      venues: venueLookup,
      stations,
      position,
    });
    if (!resolved) return;
    pick({ place: formatPlaceRef(ref), ...resolved }, shownRadius);
  };

  const useMyLocation = async () => {
    setAskedForLocation(true);
    const position = await onRequestLocation();
    if (position) pickPlace({ kind: "here" }, position);
  };

  return (
    <div className={styles.placePicker}>
      {origin && (
        <p className={styles.nearSummary} role="status">
          <strong>{describeVenueOrigin(origin)}</strong> ·{" "}
          {origin.venues.length === 1
            ? "1 venue"
            : `${origin.venues.length} venues`}
        </p>
      )}
      <Button
        variant="secondary"
        className={styles.placeLocationButton}
        onClick={useMyLocation}
        disabled={geoLoading}
      >
        {geoLoading ? "Locating…" : "Use my location"}
      </Button>
      <div
        className={styles.chipGroup}
        role="radiogroup"
        aria-label="How far from the place"
      >
        {RADIUS_OPTIONS.map((option) => (
          <Chip
            key={option}
            type="radio"
            name="venue-place-radius"
            label={radiusChipLabel(option)}
            value={String(option)}
            checked={shownRadius === option}
            onChange={() => {
              if (current) pick(current, option);
              else setRadius(option);
            }}
          />
        ))}
      </div>
      <EntityQuickAdd
        ref={inputRef}
        className={styles.standaloneQuickAdd}
        items={items}
        isSelected={(id) => current?.place === id}
        onToggle={(id) => {
          const ref = parsePlaceRef(id);
          if (ref) pickPlace(ref);
        }}
        inputId="venue-place-input"
        placeholder="Search a station or venue…"
        ariaLabel="Search a station or venue"
        pickVerb="choose"
      />
      {notice && (
        <p className={styles.geoNotice} role="status">
          {notice}
        </p>
      )}
      {stationsFailed && (
        <p className={styles.geoNotice} role="status">
          Stations couldn&apos;t be loaded, but venues can still be searched.
        </p>
      )}
      {askedForLocation && geoError && (
        <p className={styles.geoError} role="alert">
          {geoError}
        </p>
      )}
    </div>
  );
}
