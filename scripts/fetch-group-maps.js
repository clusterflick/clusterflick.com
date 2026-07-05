/* eslint-disable */
const fs = require("node:fs");
const fsp = require("node:fs").promises;
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");
const { getAllCinemaAttributes } = require("scripts/cinemas");

const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "public",
  "images",
  "venue-groups",
);
const DELAY_MS = 1000;

const MAP_WIDTH = 600;
const MAP_HEIGHT = 400;
const MAP_SCALE = 2; // retina

// URL length limit for the Static Maps API (conservative).
const MAX_URL_LENGTH = 8192;

// Neon pink (#f12869) to match the borough map overlay colour.
const MARKER_COLOR = "0xF12869";

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

// The cinema group registry is the single source of truth. It's a TypeScript
// module, but it has no imports and Node strips the types on the fly, so we can
// import it directly rather than mirroring the list here.
const VENUE_GROUPS_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "venue-groups.ts",
);

async function loadVenueGroups() {
  const mod = await import(pathToFileURL(VENUE_GROUPS_PATH).href);
  // Only slug + groupName are needed here (groupName joins to venue.groupName;
  // slug is the output filename base).
  return mod.VENUE_GROUPS.map(({ slug, groupName }) => ({ slug, groupName }));
}

// ── Dark theme map styles (matches fetch-venue-maps.js) ──────────────────────
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
 * Build a Static Maps URL with one marker per venue. Center and zoom are
 * omitted so the API auto-fits the viewport to the marker bounds — the same
 * auto-fit approach the borough script uses for its polygon path.
 */
function buildStaticMapUrl(coords, apiKey) {
  const base = "https://maps.googleapis.com/maps/api/staticmap";

  const styleParams = MAP_STYLES.map(
    (s) => `style=${encodeURIComponent(s)}`,
  ).join("&");

  const markerLocations = coords.map(({ lat, lon }) => `${lat},${lon}`);
  const markerParam = `markers=${encodeURIComponent(
    `color:${MARKER_COLOR}|${markerLocations.join("|")}`,
  )}`;

  return `${base}?size=${MAP_WIDTH}x${MAP_HEIGHT}&scale=${MAP_SCALE}&maptype=roadmap&${markerParam}&${styleParams}&key=${apiKey}`;
}

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

// ── Main ─────────────────────────────────────────────────────────────────────

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

  const VENUE_GROUPS = await loadVenueGroups();
  const allAttributes = getAllCinemaAttributes();

  // Coordinates per group (venues with valid geo only)
  const coordsByGroupName = new Map();
  for (const attr of allAttributes) {
    if (attr.structure !== "group" || !attr.groupName) continue;
    if (!attr.geo || !attr.geo.lat || !attr.geo.lon) continue;
    if (!coordsByGroupName.has(attr.groupName)) {
      coordsByGroupName.set(attr.groupName, []);
    }
    coordsByGroupName
      .get(attr.groupName)
      .push({ lat: attr.geo.lat, lon: attr.geo.lon });
  }

  console.log(`\n${colors.bright}Cinema Group Map Generator${colors.reset}`);
  console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}`);
  console.log(`  Groups:             ${VENUE_GROUPS.length}`);
  console.log(
    `  Map size:           ${MAP_WIDTH * MAP_SCALE}x${MAP_HEIGHT * MAP_SCALE}px (${MAP_WIDTH}x${MAP_HEIGHT} @${MAP_SCALE}x)`,
  );
  console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}\n`);

  await fsp.mkdir(OUTPUT_DIR, { recursive: true });

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  const failures = [];

  for (let i = 0; i < VENUE_GROUPS.length; i++) {
    const group = VENUE_GROUPS[i];
    const pad = String(VENUE_GROUPS.length).length;
    const progress = `[${String(i + 1).padStart(pad, " ")}/${VENUE_GROUPS.length}]`;
    const filePath = path.join(OUTPUT_DIR, `${group.slug}.png`);

    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      skipCount++;
      console.log(
        `${colors.gray}${progress} ${group.slug} — already exists${colors.reset}`,
      );
      continue;
    }

    const coords = coordsByGroupName.get(group.groupName) || [];
    if (coords.length === 0) {
      failCount++;
      failures.push({ slug: group.slug, error: "no venues with coordinates" });
      console.log(
        `${colors.red}${progress} ${group.slug} — no venues with coordinates${colors.reset}`,
      );
      continue;
    }

    try {
      const url = buildStaticMapUrl(coords, apiKey);
      if (url.length > MAX_URL_LENGTH) {
        throw new Error(`URL too long (${url.length})`);
      }
      await downloadMap(url, filePath);

      successCount++;
      console.log(
        `${colors.green}${progress} ${group.slug} — saved (${coords.length} venues)${colors.reset}`,
      );
    } catch (err) {
      failCount++;
      failures.push({ slug: group.slug, error: err.message });
      console.log(
        `${colors.red}${progress} ${group.slug} — ${err.message}${colors.reset}`,
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
