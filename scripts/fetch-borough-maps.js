/* eslint-disable */
const fs = require("node:fs");
const fsp = require("node:fs").promises;
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");
const { simplify } = require("@turf/simplify");
const {
  LONDON_BOROUGHS,
  dissolveBoroughBoundary,
} = require("./lib/borough-boundaries");

const OUTPUT_DIR = path.join(__dirname, "..", "public", "images", "boroughs");

const DELAY_MS = 1000;

const MAP_WIDTH = 600;
const MAP_HEIGHT = 400;
const MAP_SCALE = 2; // retina

// Simplification tolerance in degrees (~55m at London's latitude).
// Lower = more detail, higher = fewer points.
const SIMPLIFY_TOLERANCE = 0.0005;

// URL length limit for the Static Maps API (conservative).
const MAX_URL_LENGTH = 8192;

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// ── Dark theme map styles (matches fetch-venue-maps.js) ─────────────────────
const MAP_STYLES = [
  "feature:all|element:geometry|color:0x1a1a2e",
  "feature:all|element:labels.text.fill|color:0xc0c0c0",
  "feature:all|element:labels.text.stroke|color:0x1a1a2e",
  "feature:water|element:geometry|color:0x0d1b2a",
  "feature:road|element:geometry|color:0x2a2a4a",
  "feature:road|element:geometry.stroke|color:0x1a1a2e",
  "feature:poi|element:geometry|color:0x1f1f3a",
  "feature:poi.park|element:geometry|color:0x1a2e1a",
  "feature:transit|element:geometry|color:0x1f1f3a",
  "feature:landscape|element:geometry|color:0x1a1a2e",
];

// ── Polygon overlay colours ─────────────────────────────────────────────────
// Google Static API uses 0xRRGGBBAA format
// Neon pink (#f12869) from --color-neon-pink in globals.css
const FILL_COLOR = "0xF1286940"; // semi-transparent neon pink fill
const STROKE_COLOR = "0xF12869FF"; // solid neon pink stroke
const STROKE_WEIGHT = 2;

// ── Helpers ─────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Google Encoded Polyline Algorithm
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 *
 * Takes an array of [lng, lat] coordinate pairs (GeoJSON order)
 * and returns an encoded polyline string.
 */
function encodePolyline(coords) {
  let encoded = "";
  let prevLat = 0;
  let prevLng = 0;

  for (const [lng, lat] of coords) {
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);
    encoded += encodeSignedValue(latE5 - prevLat);
    encoded += encodeSignedValue(lngE5 - prevLng);
    prevLat = latE5;
    prevLng = lngE5;
  }

  return encoded;
}

function encodeSignedValue(value) {
  value = value < 0 ? ~(value << 1) : value << 1;
  let encoded = "";
  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }
  encoded += String.fromCharCode(value + 63);
  return encoded;
}

/**
 * Extract the outer ring(s) from a Polygon or MultiPolygon and encode
 * each as a Google encoded polyline. Returns an array of encoded strings.
 */
function getEncodedRings(feature) {
  const geom = feature.geometry;

  if (geom.type === "Polygon") {
    return [encodePolyline(geom.coordinates[0])];
  }

  if (geom.type === "MultiPolygon") {
    // Encode the outer ring of each polygon part
    return geom.coordinates.map((poly) => encodePolyline(poly[0]));
  }

  throw new Error(`Unexpected geometry type: ${geom.type}`);
}

function buildStaticMapUrl(encodedRings, apiKey) {
  const base = "https://maps.googleapis.com/maps/api/staticmap";

  const styleParams = MAP_STYLES.map(
    (s) => `style=${encodeURIComponent(s)}`,
  ).join("&");

  // Build one path param per ring (supports MultiPolygon)
  const pathParams = encodedRings
    .map(
      (enc) =>
        `path=${encodeURIComponent(
          `fillcolor:${FILL_COLOR}|color:${STROKE_COLOR}|weight:${STROKE_WEIGHT}|enc:${enc}`,
        )}`,
    )
    .join("&");

  // Omit center & zoom — the API auto-fits to the path bounds
  return `${base}?size=${MAP_WIDTH}x${MAP_HEIGHT}&scale=${MAP_SCALE}&maptype=roadmap&${pathParams}&${styleParams}&key=${apiKey}`;
}

// ── Main ────────────────────────────────────────────────────────────────────

(async function () {
  loadEnv();

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error(
      `${colors.red}Error: GOOGLE_MAPS_API_KEY not found.${colors.reset}\n` +
        `Add it to .env in the project root:\n` +
        `  GOOGLE_MAPS_API_KEY=your_key_here\n`,
    );
    process.exit(1);
  }

  console.log(`\n${colors.bright}Borough Map Generator${colors.reset}`);
  console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}`);
  console.log(`  Boroughs:           ${LONDON_BOROUGHS.length}`);
  console.log(
    `  Map size:           ${MAP_WIDTH * MAP_SCALE}x${MAP_HEIGHT * MAP_SCALE}px (${MAP_WIDTH}x${MAP_HEIGHT} @${MAP_SCALE}x)`,
  );
  console.log(`  Simplify tolerance: ${SIMPLIFY_TOLERANCE}`);
  console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}\n`);

  await fsp.mkdir(OUTPUT_DIR, { recursive: true });

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  const failures = [];

  for (let i = 0; i < LONDON_BOROUGHS.length; i++) {
    const borough = LONDON_BOROUGHS[i];
    const pad = String(LONDON_BOROUGHS.length).length;
    const progress = `[${String(i + 1).padStart(pad, " ")}/${LONDON_BOROUGHS.length}]`;
    const filename = `${borough.slug}.png`;
    const filePath = path.join(OUTPUT_DIR, filename);

    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      skipCount++;
      console.log(
        `${colors.gray}${progress} ${borough.slug} — already exists${colors.reset}`,
      );
      continue;
    }

    try {
      // Dissolve + simplify boundary
      const boundary = dissolveBoroughBoundary(
        borough.name,
        SIMPLIFY_TOLERANCE,
      );
      const encodedRings = getEncodedRings(boundary);

      const url = buildStaticMapUrl(encodedRings, apiKey);

      if (url.length > MAX_URL_LENGTH) {
        console.log(
          `${colors.yellow}${progress} ${borough.slug} — URL length ${url.length} exceeds limit, increasing tolerance${colors.reset}`,
        );
        // Fallback: re-simplify with a higher tolerance
        const coarser = simplify(boundary, {
          tolerance: SIMPLIFY_TOLERANCE * 3,
          highQuality: true,
        });
        const coarserRings = getEncodedRings(coarser);
        const coarserUrl = buildStaticMapUrl(coarserRings, apiKey);
        if (coarserUrl.length > MAX_URL_LENGTH) {
          throw new Error(
            `URL still too long (${coarserUrl.length}) even after coarser simplification`,
          );
        }
        // Use the coarser version
        await downloadMap(coarserUrl, filePath);
      } else {
        await downloadMap(url, filePath);
      }

      successCount++;
      console.log(
        `${colors.green}${progress} ${borough.slug} — saved${colors.reset}`,
      );
    } catch (err) {
      failCount++;
      failures.push({ slug: borough.slug, error: err.message });
      console.log(
        `${colors.red}${progress} ${borough.slug} — ${err.message}${colors.reset}`,
      );
    }

    await sleep(DELAY_MS);
  }

  // Summary
  console.log(`\n${colors.dim}${"─".repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}Results${colors.reset}`);
  console.log(`  ${colors.green}Downloaded: ${successCount}${colors.reset}`);
  if (skipCount > 0) {
    console.log(
      `  ${colors.gray}Skipped:    ${skipCount} (already exist)${colors.reset}`,
    );
  }
  if (failCount > 0) {
    console.log(`  ${colors.red}Failed:     ${failCount}${colors.reset}`);
    for (const { slug, error } of failures) {
      console.log(`  ${colors.red}  - ${slug}: ${error}${colors.reset}`);
    }
  }
  console.log(`\n  ${colors.dim}Output: ${OUTPUT_DIR}${colors.reset}\n`);
})();

async function downloadMap(url, filePath) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    const body = await response.text();
    throw new Error(`Not an image (${contentType}): ${body.slice(0, 200)}`);
  }

  await pipeline(
    Readable.fromWeb(response.body),
    fs.createWriteStream(filePath),
  );
}
