import fs from "node:fs";
import path from "node:path";
import { point, polygon } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Venue } from "@/types";
import { LONDON_BOROUGHS, type LondonBorough } from "@/data/london-boroughs";

type BoroughBoundary = {
  borough: LondonBorough;
  polygons: ReturnType<typeof polygon>[];
};

let cachedBoundaries: BoroughBoundary[] | null = null;

const BOROUGHS_DIR = path.join(
  process.cwd(),
  "node_modules",
  "data-analysed",
  "data",
  "boroughs",
);

function loadBoundaries(): BoroughBoundary[] {
  if (cachedBoundaries) return cachedBoundaries;

  cachedBoundaries = LONDON_BOROUGHS.map((borough) => {
    const filename = borough.name.replace(/ /g, "-") + ".geojson";
    const filepath = path.join(BOROUGHS_DIR, filename);
    const geojson = JSON.parse(fs.readFileSync(filepath, "utf8"));

    const polygons = geojson.features
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((feature: any) =>
        feature.geometry.coordinates.every(
          (ring: number[][]) => ring.length >= 4,
        ),
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((feature: any) => polygon(feature.geometry.coordinates));

    return { borough, polygons };
  });

  return cachedBoundaries;
}

/**
 * Find which borough a venue belongs to using GeoJSON boundary data.
 * Checks if the venue's coordinates fall within any of the borough's
 * boundary polygons (MSOA zones).
 */
export function getVenueBorough(venue: Venue): LondonBorough | null {
  const boundaries = loadBoundaries();
  const pt = point([venue.geo.lon, venue.geo.lat]);

  for (const { borough, polygons: polys } of boundaries) {
    for (const poly of polys) {
      if (booleanPointInPolygon(pt, poly)) {
        return borough;
      }
    }
  }

  return null;
}

/**
 * Group all venues by borough using GeoJSON boundary polygons.
 * Venues outside all borough boundaries are excluded.
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
