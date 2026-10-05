import type { Position, Venue } from "@/types";
import { getDistanceInMiles, getNearbyVenueIds } from "@/utils/geo-distance";

/**
 * A place to pick venues near, which need not be where the reader's device is:
 * a visitor plans from where they'll be, not where they are.
 *
 * - `here` — the reader's own position.
 * - `station` — a Tube, Overground, Elizabeth line or DLR station, by slug
 *   (`src/data/london-stations.json`). How most people say where they'll be.
 * - `venue` — a venue in the dataset, by id ("near the BFI Southbank").
 *
 * Boroughs are deliberately not places: a borough is an area, not a point,
 * and its venues are decided by boundary rather than distance. Its page links
 * to its venues already.
 */
export type PlaceRef =
  | { kind: "here" }
  | { kind: "station"; slug: string }
  | { kind: "venue"; id: string };

export type Station = {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  modes: string[];
};

/**
 * How far from a place to pick venues: a number of miles, or `auto` — the
 * Venues Near Me rule (`getNearbyVenueIds`), which starts at half a mile and
 * widens until it has ten venues, up to two. Auto suits a dense centre and a
 * sparse suburb alike, so it is the default; a number is for a reader who
 * knows how far they'll go.
 */
export type PlaceRadius = number | "auto";

/** The radius a place is searched within until the reader picks another. */
export const DEFAULT_RADIUS: PlaceRadius = "auto";

/** The radii offered beside the place search. */
export const RADIUS_OPTIONS: readonly PlaceRadius[] = ["auto", 0.5, 1, 2, 3];

/**
 * Reads a place from its id: `here`, `station:<slug>` or `venue:<id>`. Null
 * for anything else.
 */
export function parsePlaceRef(raw: string): PlaceRef | null {
  if (raw === "here") return { kind: "here" };
  const colon = raw.indexOf(":");
  if (colon === -1) return null;
  const kind = raw.slice(0, colon);
  const rest = raw.slice(colon + 1);
  if (!rest) return null;
  if (kind === "station") return { kind: "station", slug: rest };
  if (kind === "venue") return { kind: "venue", id: rest };
  return null;
}

/** A place's id; the inverse of {@link parsePlaceRef}. */
export function formatPlaceRef(ref: PlaceRef): string {
  switch (ref.kind) {
    case "here":
      return "here";
    case "station":
      return `station:${ref.slug}`;
    case "venue":
      return `venue:${ref.id}`;
  }
}

/** "half a mile", "1 mile", "2 miles". */
export function formatRadiusLabel(miles: number): string {
  if (miles === 0.5) return "half a mile";
  const rounded = Math.round(miles * 10) / 10;
  return `${rounded} ${rounded === 1 ? "mile" : "miles"}`;
}

/** What {@link resolvePlace} looks places up in; anything not loaded is null. */
export type PlaceContext = {
  venues: Record<string, Pick<Venue, "id" | "name" | "geo">> | null;
  stations: Station[] | null;
  /** The reader's own position, for `here`. */
  position: Position | null;
};

export type ResolvedPlace = {
  /** Reads after "of": "you", "King's Cross St. Pancras". */
  label: string;
  point: Position;
};

/**
 * Where a place is and what to call it, or null when it isn't known: a
 * station or venue the data doesn't hold, or `here` before a position.
 */
export function resolvePlace(
  ref: PlaceRef,
  context: PlaceContext,
): ResolvedPlace | null {
  switch (ref.kind) {
    case "here":
      return context.position
        ? { label: "you", point: context.position }
        : null;
    case "station": {
      const station = context.stations?.find((s) => s.slug === ref.slug);
      return station
        ? { label: station.name, point: { lat: station.lat, lon: station.lon } }
        : null;
    }
    case "venue": {
      const venue = context.venues?.[ref.id];
      return venue ? { label: venue.name, point: venue.geo } : null;
    }
  }
}

/**
 * Every venue within `radiusMiles` of `point`, nearest first. Unlike `auto`
 * ({@link getVenueIdsNear}), a number is the reader's and is never grown to
 * find more: "within 2 miles" means within 2 miles.
 */
export function getVenueIdsWithin(
  point: Position,
  radiusMiles: number,
  venues: Record<string, Pick<Venue, "id" | "geo">>,
): string[] {
  return Object.values(venues)
    .map((venue) => ({
      id: venue.id,
      distance: getDistanceInMiles(point, venue.geo),
    }))
    .filter((venue) => venue.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance)
    .map((venue) => venue.id);
}

/**
 * The venues a radius picks around a point, sorted by id. `venues` must be
 * only those with something showing: `auto` counts them to decide how far to
 * go, so an empty venue would stop it short.
 *
 * Sorted because the result becomes a venue selection, which is a set: the
 * same venues should always make the same URL, however they were found.
 */
export function getVenueIdsNear(
  point: Position,
  radius: PlaceRadius,
  venues: Record<string, Pick<Venue, "id" | "geo">>,
): string[] {
  const all = Object.values(venues);
  const ids =
    radius === "auto"
      ? getNearbyVenueIds(point, all, new Set(all.map((venue) => venue.id)))
      : getVenueIdsWithin(point, radius, venues);
  return ids.sort();
}

/**
 * The place a venue selection was picked from, remembered beside the filter
 * rather than in it. The venue filter only ever holds ids, and a URL carries
 * only those; this lets the tab that made the pick describe it ("Within 2
 * miles of King's Cross") and change its radius or place without starting
 * again. It stands for the selection only while the selection is still
 * exactly the venues it produced ({@link isVenueOriginCurrent}).
 */
export type VenueOrigin = {
  /** The place's id, as {@link formatPlaceRef} writes it. */
  place: string;
  label: string;
  /** Kept so a new radius needs no lookup, and `here` stays where it was. */
  point: Position;
  radius: PlaceRadius;
  venues: string[];
};

/** Whether `selected` is still exactly the venues `origin` picked. */
export function isVenueOriginCurrent(
  origin: VenueOrigin | null | undefined,
  selected: string[] | null,
): origin is VenueOrigin {
  if (!origin || !selected || selected.length !== origin.venues.length) {
    return false;
  }
  const picked = new Set(origin.venues);
  return selected.every((id) => picked.has(id));
}

/** "Near you", "Within 2 miles of King's Cross St. Pancras". */
export function describeVenueOrigin(
  origin: Pick<VenueOrigin, "label" | "radius">,
): string {
  return origin.radius === "auto"
    ? `Near ${origin.label}`
    : `Within ${formatRadiusLabel(origin.radius)} of ${origin.label}`;
}

let stationsPromise: Promise<Station[]> | null = null;

/**
 * The station list, loaded on first use: it is ~9KB gzipped, and only readers
 * picking venues near a station need it.
 */
export function loadStations(): Promise<Station[]> {
  if (!stationsPromise) {
    stationsPromise = import("@/data/london-stations.json")
      .then((module) => module.default as Station[])
      .catch((error) => {
        // Let the next caller try again rather than caching the failure.
        stationsPromise = null;
        throw error;
      });
  }
  return stationsPromise;
}
