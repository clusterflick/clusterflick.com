/* eslint-disable */
const fs = require("node:fs");
const fsp = require("node:fs").promises;
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");
const { getAllCinemaAttributes } = require("scripts/cinemas");

const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "public",
  "images",
  "venues",
  "maps",
);
const DELAY_MS = 1000;

const MAP_WIDTH = 600;
const MAP_HEIGHT = 400;
const MAP_ZOOM = 15;
const MAP_SCALE = 2; // retina

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
    // Strip surrounding quotes
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

// Dark theme styles to match the site's colour scheme
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

function buildStaticMapUrl(lat, lon, apiKey) {
  // Build URL manually because URLSearchParams doesn't handle repeated
  // `style` params and encodes pipe characters unnecessarily
  const base = "https://maps.googleapis.com/maps/api/staticmap";
  const styleParams = MAP_STYLES.map(
    (s) => `style=${encodeURIComponent(s)}`,
  ).join("&");

  return `${base}?center=${lat},${lon}&zoom=${MAP_ZOOM}&size=${MAP_WIDTH}x${MAP_HEIGHT}&scale=${MAP_SCALE}&maptype=roadmap&markers=${encodeURIComponent(`color:red|${lat},${lon}`)}&${styleParams}&key=${apiKey}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  const allAttributes = getAllCinemaAttributes();

  // Filter to venues with geo coordinates
  const venues = allAttributes.filter(
    (attr) => attr.geo && attr.geo.lat && attr.geo.lon,
  );

  console.log(`\n${colors.bright}Venue Map Generator${colors.reset}`);
  console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}`);
  console.log(`  Total venues:       ${allAttributes.length}`);
  console.log(`  With coordinates:   ${venues.length}`);
  console.log(
    `  Map size:           ${MAP_WIDTH * MAP_SCALE}x${MAP_HEIGHT * MAP_SCALE}px (${MAP_WIDTH}x${MAP_HEIGHT} @${MAP_SCALE}x)`,
  );
  console.log(`  Zoom level:         ${MAP_ZOOM}`);
  console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}\n`);

  await fsp.mkdir(OUTPUT_DIR, { recursive: true });

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  const failures = [];

  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    const pad = String(venues.length).length;
    const progress = `[${String(i + 1).padStart(pad, " ")}/${venues.length}]`;
    const filename = `${venue.id}.png`;
    const filePath = path.join(OUTPUT_DIR, filename);

    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      skipCount++;
      console.log(
        `${colors.gray}${progress} ${venue.id} — already exists${colors.reset}`,
      );
      continue;
    }

    const url = buildStaticMapUrl(venue.geo.lat, venue.geo.lon, apiKey);

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        // Google returns JSON errors as application/json
        const body = await response.text();
        throw new Error(`Not an image (${contentType}): ${body.slice(0, 200)}`);
      }

      await pipeline(
        Readable.fromWeb(response.body),
        fs.createWriteStream(filePath),
      );

      successCount++;
      console.log(
        `${colors.green}${progress} ${venue.id} — saved${colors.reset}`,
      );
    } catch (err) {
      failCount++;
      failures.push({ id: venue.id, error: err.message });
      console.log(
        `${colors.red}${progress} ${venue.id} — ${err.message}${colors.reset}`,
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
    for (const { id, error } of failures) {
      console.log(`  ${colors.red}  - ${id}: ${error}${colors.reset}`);
    }
  }
  console.log(`\n  ${colors.dim}Output: ${OUTPUT_DIR}${colors.reset}\n`);
})();
