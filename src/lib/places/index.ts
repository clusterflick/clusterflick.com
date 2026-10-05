import type { Position, Venue } from "@/types";
import { getDistanceInMiles } from "@/utils/geo-distance";

/**
 * A place a reader can search near, which need not be where their device is:
 * a visitor plans from where they'll be, not where they are.
 *
 * - `here` — the reader's own position, resolved on their device. A shared
 *   link therefore means "near you" to whoever opens it, and never carries
 *   the sender's location.
 * - `station` — a Tube, Overground, Elizabeth line or DLR station, by slug
 *   (`src/data/london-stations.json`). How most people say where they'll be.
 * - `venue` — a venue in the dataset, by id ("near the BFI Southbank").
 * - `pin` — a point dropped on a map. Rounded when written (see
 *   {@link PIN_DECIMALS}), since a link can be shared.
 *
 * Boroughs are deliberately not places: a borough is an area, not a point,
 * and its venues are decided by boundary rather than distance. Its page links
 * to its venues already.
 */
export type PlaceRef =
  | { kind: "here" }
  | { kind: "station"; slug: string }
  | { kind: "venue"; id: string }
  | { kind: "pin"; lat: number; lon: number };

export type Station = {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  modes: string[];
};

/**
 * Three decimal places is about 100m: precise enough to search within half a
 * mile of, and too coarse to give away which house a pin was dropped on.
 */
export const PIN_DECIMALS = 3;

/** The radius a place is searched within until the reader picks another. */
export const DEFAULT_RADIUS_MILES = 1;

/** The radii offered in the overlay. Links may carry any within the limits. */
export const RADIUS_OPTIONS_MILES = [0.5, 1, 2, 3] as const;

export const MIN_RADIUS_MILES = 0.1;
export const MAX_RADIUS_MILES = 10;

const KM_PER_MILE = 1.609344;

// Roughly Greater London with a margin. A pin outside it is a typo, not a
// place anyone is going to the cinema from.
const LONDON_BOUNDS = {
  minLat: 51.2,
  maxLat: 51.75,
  minLon: -0.6,
  maxLon: 0.4,
};

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Reads a place from its URL form: `here`, `station:<slug>`, `venue:<id>` or
 * `pin:<lat>,<lon>`. Returns null for anything else, including a pin outside
 * London.
 */
export function parsePlaceRef(raw: string): PlaceRef | null {
  const value = raw.trim();
  if (value === "here") return { kind: "here" };

  const colon = value.indexOf(":");
  if (colon === -1) return null;
  const kind = value.slice(0, colon);
  const rest = value.slice(colon + 1).trim();
  if (!rest) return null;

  switch (kind) {
    case "station":
      return { kind: "station", slug: rest };
    case "venue":
      return { kind: "venue", id: rest };
    case "pin": {
      const parts = rest.split(",");
      if (parts.length !== 2) return null;
      const lat = Number(parts[0]);
      const lon = Number(parts[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      if (
        lat < LONDON_BOUNDS.minLat ||
        lat > LONDON_BOUNDS.maxLat ||
        lon < LONDON_BOUNDS.minLon ||
        lon > LONDON_BOUNDS.maxLon
      ) {
        return null;
      }
      return {
        kind: "pin",
        lat: roundTo(lat, PIN_DECIMALS),
        lon: roundTo(lon, PIN_DECIMALS),
      };
    }
    default:
      return null;
  }
}

/** The URL form of a place; the inverse of {@link parsePlaceRef}. */
export function formatPlaceRef(ref: PlaceRef): string {
  switch (ref.kind) {
    case "here":
      return "here";
    case "station":
      return `station:${ref.slug}`;
    case "venue":
      return `venue:${ref.id}`;
    case "pin":
      return `pin:${roundTo(ref.lat, PIN_DECIMALS)},${roundTo(ref.lon, PIN_DECIMALS)}`;
  }
}

/**
 * Reads a radius from its URL form: `1mi`, `2km`, or a bare number of miles.
 * Kilometres are accepted because that is how plenty of readers think of a
 * walk ("within 2km"); the site works in miles, so they are converted.
 * Out-of-range values are clamped rather than rejected — a link asking for
 * 50 miles still means "a long way", not "ignore me".
 */
export function parseRadius(raw: string): number | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(mi|km)?\s*$/i.exec(raw);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!(amount > 0)) return null;
  const miles =
    match[2]?.toLowerCase() === "km" ? amount / KM_PER_MILE : amount;
  return Math.min(MAX_RADIUS_MILES, Math.max(MIN_RADIUS_MILES, miles));
}

/** The URL form of a radius, always in miles. */
export function formatRadius(miles: number): string {
  return `${roundTo(miles, 2)}mi`;
}

/** "half a mile", "1 mile", "1.2 miles". */
export function formatRadiusLabel(miles: number): string {
  if (miles === 0.5) return "half a mile";
  const rounded = roundTo(miles, 1);
  return `${rounded} ${rounded === 1 ? "mile" : "miles"}`;
}

/** What {@link resolvePlace} needs; anything not yet loaded is null. */
export type PlaceContext = {
  venues: Record<string, Pick<Venue, "id" | "name" | "geo">> | null;
  stations: Station[] | null;
  /** The reader's own position, for `here`. */
  position: Position | null;
};

export type ResolvedPlace = {
  /** Reads after "near": "you", "King's Cross St. Pancras", "a dropped pin". */
  label: string;
  point: Position;
};

/**
 * Where a place is and what to call it. Null while what it needs hasn't
 * loaded (the stations, the venues, the reader's position) — and for a
 * station or venue the data doesn't hold, which {@link isPlaceResolvable}
 * tells apart.
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
    case "pin":
      return { label: "a dropped pin", point: { lat: ref.lat, lon: ref.lon } };
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
 * Whether everything {@link resolvePlace} needs for this place has loaded, so
 * a null from it means the place doesn't exist rather than "not yet".
 */
export function isPlaceResolvable(
  ref: PlaceRef,
  context: PlaceContext,
): boolean {
  switch (ref.kind) {
    case "here":
      return context.position !== null;
    case "pin":
      return true;
    case "station":
      return context.stations !== null;
    case "venue":
      return context.venues !== null;
  }
}

/**
 * Every venue within `radiusMiles` of `point`, nearest first. Unlike the
 * "Venues near me" rule (`getNearbyVenueIds`), the radius is the reader's and
 * is never grown to find more: "within 2km" means within 2km.
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

let stationsPromise: Promise<Station[]> | null = null;

/**
 * The station list, loaded on first use: it is ~9KB gzipped, and only readers
 * searching near a station need it.
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

/**
 * A name for a place before it resolves, so a description never reads "near
 * null" while the stations load or the reader's position is found. A station's
 * slug reads well enough title-cased; a venue's id doesn't, and is left vague.
 */
export function getPlaceFallbackLabel(ref: PlaceRef): string {
  switch (ref.kind) {
    case "here":
      return "you";
    case "pin":
      return "a dropped pin";
    case "venue":
      return "a venue";
    case "station":
      return ref.slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
}
