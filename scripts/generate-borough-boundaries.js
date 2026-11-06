/* eslint-disable */
/**
 * Builds src/data/london-borough-boundaries.json: one simplified outline per
 * London borough, which /london-cinemas draws as a map of what's on in each.
 *
 * Generated rather than worked out at build time: dissolving 47MB of MSOA
 * zones into 33 outlines takes ~25s, which every build worker rendering the
 * page would pay, for boundaries that change on the scale of decades. Rerun
 * with `npm run generate-borough-boundaries` if `data-analysed`'s boroughs
 * change, and commit the result.
 *
 * Each borough is simplified on its own, so neighbours can part by a few
 * metres along a shared edge. At the tolerance below that is well under a
 * pixel at the widths the map is drawn, and the outline stroke covers it.
 */
const fs = require("node:fs");
const path = require("node:path");
const {
  LONDON_BOROUGHS,
  dissolveBoroughBoundary,
} = require("./lib/borough-boundaries");

const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "london-borough-boundaries.json",
);

// ~55-90m at London's latitude: the map is ~50km across in under 1000px, so
// a pixel is ~50m and finer detail is never drawn.
const SIMPLIFY_TOLERANCE = 0.0008;

// 4 decimal places is ~7-11m, finer than the simplification.
const round = (n) => Math.round(n * 1e4) / 1e4;
const roundCoordinates = (value) =>
  typeof value[0] === "number" ? value.map(round) : value.map(roundCoordinates);

const started = Date.now();
const total = LONDON_BOROUGHS.length;
console.log(`Dissolving and simplifying ${total} borough boundaries`);

const boroughs = {};
LONDON_BOROUGHS.forEach((borough, index) => {
  process.stdout.write(
    `\r  [${index + 1}/${total}] ${borough.name}`.padEnd(48),
  );
  const { geometry } = dissolveBoroughBoundary(
    borough.name,
    SIMPLIFY_TOLERANCE,
  );
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
    throw new Error(
      `Unexpected geometry for ${borough.name}: ${geometry.type}`,
    );
  }
  boroughs[borough.slug] = {
    type: geometry.type,
    coordinates: roundCoordinates(geometry.coordinates),
  };
});

const output = {
  source:
    "clusterflick/data-analysed data/boroughs, dissolved and simplified by scripts/generate-borough-boundaries.js",
  boroughs,
};
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output) + "\n");

const seconds = ((Date.now() - started) / 1000).toFixed(1);
const kb = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1);
process.stdout.write("\r".padEnd(49) + "\r");
console.log(
  `Wrote ${total} boroughs (${kb}KB) in ${seconds}s to ${path.relative(process.cwd(), OUTPUT_PATH)}`,
);
