/* eslint-disable */
/**
 * Borough boundaries from `data-analysed`, shared by the scripts that draw
 * them: `fetch-borough-maps.js` (each borough page's map image) and
 * `generate-borough-boundaries.js` (the map of every borough on
 * /london-cinemas).
 *
 * `data-analysed` holds each borough as its MSOA zones, hundreds of polygons a
 * borough and 47MB in all, so they are dissolved into one outline first.
 */
const fs = require("node:fs");
const path = require("node:path");
const { union } = require("@turf/union");
const { simplify } = require("@turf/simplify");
const { featureCollection } = require("@turf/helpers");

const BOROUGHS_DIR = path.join(
  path.dirname(require.resolve("data-analysed/package.json")),
  "data",
  "boroughs",
);

// Mirrors src/data/london-boroughs.ts; the boundaries test holds the
// generated file to that list.
const LONDON_BOROUGHS = [
  { name: "Camden", slug: "camden" },
  { name: "City of London", slug: "city-of-london" },
  { name: "Greenwich", slug: "greenwich" },
  { name: "Hackney", slug: "hackney" },
  { name: "Hammersmith and Fulham", slug: "hammersmith-and-fulham" },
  { name: "Islington", slug: "islington" },
  { name: "Kensington and Chelsea", slug: "kensington-and-chelsea" },
  { name: "Lambeth", slug: "lambeth" },
  { name: "Lewisham", slug: "lewisham" },
  { name: "Newham", slug: "newham" },
  { name: "Southwark", slug: "southwark" },
  { name: "Tower Hamlets", slug: "tower-hamlets" },
  { name: "Wandsworth", slug: "wandsworth" },
  { name: "Westminster", slug: "westminster" },
  { name: "Barking and Dagenham", slug: "barking-and-dagenham" },
  { name: "Barnet", slug: "barnet" },
  { name: "Bexley", slug: "bexley" },
  { name: "Brent", slug: "brent" },
  { name: "Bromley", slug: "bromley" },
  { name: "Croydon", slug: "croydon" },
  { name: "Ealing", slug: "ealing" },
  { name: "Enfield", slug: "enfield" },
  { name: "Haringey", slug: "haringey" },
  { name: "Harrow", slug: "harrow" },
  { name: "Havering", slug: "havering" },
  { name: "Hillingdon", slug: "hillingdon" },
  { name: "Hounslow", slug: "hounslow" },
  { name: "Kingston upon Thames", slug: "kingston-upon-thames" },
  { name: "Merton", slug: "merton" },
  { name: "Redbridge", slug: "redbridge" },
  { name: "Richmond upon Thames", slug: "richmond-upon-thames" },
  { name: "Sutton", slug: "sutton" },
  { name: "Waltham Forest", slug: "waltham-forest" },
];

/**
 * Load a borough's GeoJSON, dissolve the MSOA features into a single
 * boundary, and simplify it to `tolerance` degrees.
 */
function dissolveBoroughBoundary(boroughName, tolerance) {
  const filename = boroughName.replace(/ /g, "-") + ".geojson";
  const filepath = path.join(BOROUGHS_DIR, filename);
  const geojson = JSON.parse(fs.readFileSync(filepath, "utf8"));

  // A zone split by the river or a boundary is a MultiPolygon, whose
  // coordinates are polygons rather than rings: reading them as rings once
  // dropped Pimlico from Westminster and Erith from Bexley. A ring too short
  // to be a polygon is bad data, so fail rather than lose part of a borough.
  const zones = geojson.features;
  for (const zone of zones) {
    const { type, coordinates } = zone.geometry;
    if (type !== "Polygon" && type !== "MultiPolygon") {
      throw new Error(`${boroughName}: unexpected ${type} zone`);
    }
    const polygons = type === "Polygon" ? [coordinates] : coordinates;
    if (polygons.some((rings) => rings.some((ring) => ring.length < 4))) {
      throw new Error(`${boroughName}: zone has a ring of under 4 points`);
    }
  }

  if (zones.length === 0) {
    throw new Error(`No zones found for ${boroughName}`);
  }

  const merged =
    zones.length === 1 ? zones[0] : union(featureCollection(zones));

  return simplify(merged, { tolerance, highQuality: true });
}

module.exports = { LONDON_BOROUGHS, dissolveBoroughBoundary };
