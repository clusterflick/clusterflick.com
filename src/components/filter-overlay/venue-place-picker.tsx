"use client";

import {
  Ref,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import type { Position, Venue } from "@/types";
import {
  DEFAULT_RADIUS,
  RADIUS_OPTIONS,
  describeVenueOrigin,
  findWiderVenueOrigin,
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
  /**
   * How many events the reader's other filters find at these venues. With it,
   * a place whose venues have nothing for them says so and how far would.
   */
  countEventsAt?: (venueIds: string[]) => number;
  /** Lets the Near Me and Near a Station… pills drive the picker as it opens. */
  ref?: Ref<VenuePlacePickerHandle>;
}

export interface VenuePlacePickerHandle {
  /**
   * Pick the venues around the reader at `radius`, asking for their position
   * if need be. Without one, the station search takes focus instead, so a
   * refused prompt still leaves a way on.
   */
  locate: (radius?: PlaceRadius) => void;
  /** Focus the station-or-venue search. */
  focusSearch: () => void;
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
  countEventsAt,
  ref,
}: VenuePlacePickerProps) {
  const searchRef = useRef<EntityQuickAddHandle>(null);
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

  const pickPlace = (
    place: PlaceRef,
    position: Position | null = null,
    radius: PlaceRadius = shownRadius,
  ) => {
    const resolved = resolvePlace(place, {
      venues: venueLookup,
      stations,
      position,
    });
    if (!resolved) return;
    pick({ place: formatPlaceRef(place), ...resolved }, radius);
  };

  const locate = async (radius: PlaceRadius = shownRadius) => {
    setAskedForLocation(true);
    const position = await onRequestLocation();
    if (position) pickPlace({ kind: "here" }, position, radius);
    else searchRef.current?.focus();
  };

  // Auto picks the venues with anything on, not anything on for this search,
  // so a place can find venues and still empty the grid. Rather than leave the
  // reader to try each radius, say so and name the nearest one that works.
  const shortfall = useMemo(() => {
    if (!origin || !countEventsAt || countEventsAt(origin.venues) > 0) {
      return null;
    }
    const wider = findWiderVenueOrigin(
      origin,
      venueLookup,
      (ids) => countEventsAt(ids) > 0,
    );
    return { origin, wider, count: wider ? countEventsAt(wider.venues) : 0 };
  }, [origin, venueLookup, countEventsAt]);

  useImperativeHandle(ref, () => ({
    locate: (radius) => void locate(radius),
    focusSearch: () => searchRef.current?.focus(),
  }));

  const isHere = current?.place === "here";

  return (
    <div className={styles.placePicker}>
      {origin ? (
        <p className={styles.nearSummary} role="status">
          <strong>{describeVenueOrigin(origin)}</strong> ·{" "}
          {origin.venues.length === 1
            ? "1 venue"
            : `${origin.venues.length} venues`}
        </p>
      ) : (
        geoLoading && (
          <p className={styles.nearSummary} role="status">
            Finding your location…
          </p>
        )
      )}
      {shortfall && (
        <div
          className={clsx(styles.geoNotice, styles.radiusShortfall)}
          role="status"
        >
          <p>
            Nothing at{" "}
            {shortfall.origin.venues.length === 1
              ? "this venue"
              : "these venues"}{" "}
            matches your other filters.
            {shortfall.wider
              ? ` Within ${formatRadiusLabel(shortfall.wider.radius)}, ${shortfall.count.toLocaleString("en-GB")} ${shortfall.count === 1 ? "event does" : "events do"}.`
              : shortfall.origin.radius === WIDEST_RADIUS_MILES
                ? ""
                : ` Nor does anything within ${formatRadiusLabel(WIDEST_RADIUS_MILES)}.`}
          </p>
          {shortfall.wider && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const { wider } = shortfall;
                if (wider) pick(wider, wider.radius);
              }}
            >
              Search within {formatRadiusLabel(shortfall.wider.radius)}
            </Button>
          )}
        </div>
      )}
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
      <p className={styles.placeSearchLabel}>
        {current ? "Somewhere else?" : "Near a station or venue"}
      </p>
      <EntityQuickAdd
        ref={searchRef}
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
      {/* Back to the reader, once they've picked somewhere else (or before
          their position is known). Not offered while it's already them. */}
      {!isHere && (
        <Button
          variant="secondary"
          className={styles.placeLocationButton}
          onClick={() => void locate()}
          disabled={geoLoading}
        >
          {geoLoading ? "Locating…" : "Use my location"}
        </Button>
      )}
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
