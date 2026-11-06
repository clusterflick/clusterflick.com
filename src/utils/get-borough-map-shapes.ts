import boundaries from "@/data/london-borough-boundaries.json";

type Ring = number[][];
type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

export interface BoroughMapShapes {
  /** SVG viewBox the paths are drawn in, e.g. "0 0 1000 780". */
  viewBox: string;
  /** Path data per borough slug. */
  paths: Record<string, string>;
}

/** Width of the viewBox; the height follows from London's shape. */
const WIDTH = 1000;

let cached: BoroughMapShapes | null = null;

/**
 * Every borough's outline as SVG path data, projected for drawing London as a
 * flat map. Build-time: the outlines come from
 * `src/data/london-borough-boundaries.json` (`npm run
 * generate-borough-boundaries`), and the page ships only the paths.
 *
 * An equirectangular projection with longitude scaled by the cosine of
 * London's latitude. Over ~50km that is indistinguishable from a proper map
 * projection, and keeps this to arithmetic.
 */
export function getBoroughMapShapes(): BoroughMapShapes {
  if (cached) return cached;

  const geometries = boundaries.boroughs as Record<string, Geometry>;
  const polygonsOf = (geometry: Geometry): Ring[][] =>
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const geometry of Object.values(geometries)) {
    for (const polygon of polygonsOf(geometry)) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      }
    }
  }

  const lonScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const scale = WIDTH / ((maxLon - minLon) * lonScale);
  const height = Math.ceil((maxLat - minLat) * scale);
  const round = (n: number) => Math.round(n * 10) / 10;
  const project = ([lon, lat]: number[]) =>
    `${round((lon - minLon) * lonScale * scale)},${round((maxLat - lat) * scale)}`;

  const paths: Record<string, string> = {};
  for (const [slug, geometry] of Object.entries(geometries)) {
    paths[slug] = polygonsOf(geometry)
      .flatMap((polygon) =>
        // GeoJSON rings close on their first point; Z does that instead.
        polygon.map((ring) => `M${ring.slice(0, -1).map(project).join("L")}Z`),
      )
      .join("");
  }

  cached = { viewBox: `0 0 ${WIDTH} ${height}`, paths };
  return cached;
}
