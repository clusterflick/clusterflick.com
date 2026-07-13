import fs from "node:fs";
import path from "node:path";
import simplify from "@turf/simplify";

/**
 * Build-time only: reads the Greater London (GLA) boundary polygon shipped with
 * `data-analysed` and returns a heavily simplified version suitable for drawing
 * a faint outline on the venues map. The raw file is ~430KB; simplifying at this
 * tolerance drops it to ~8KB (~200 points) — plenty of fidelity for a
 * decorative, low-opacity boundary while keeping the client payload small.
 *
 * Mirrors the `fs`-based data-analysed access pattern in `get-borough-venues.ts`.
 */

const BOUNDARY_PATH = path.join(
  process.cwd(),
  "node_modules",
  "data-analysed",
  "data",
  "London_GLA_Boundary.geojson",
);

// ~200m of simplification — smooths the crinkly coastline/Thames edges.
const SIMPLIFY_TOLERANCE = 0.002;

let cached: GeoJSON.FeatureCollection | null = null;

export function getLondonBoundary(): GeoJSON.FeatureCollection {
  if (cached) return cached;

  const raw = JSON.parse(
    fs.readFileSync(BOUNDARY_PATH, "utf8"),
  ) as GeoJSON.FeatureCollection;

  cached = simplify(raw, {
    tolerance: SIMPLIFY_TOLERANCE,
    highQuality: false,
    mutate: true,
  });

  return cached;
}
