/* eslint-disable */
/**
 * Downloads the latest data-calendar release into ./public/calendars/.
 *
 * The release publishes one ICS file per venue, named after the venue id with
 * no extension (`actonecinema.co.uk`). We serve them from our own origin rather
 * than linking at the release: same origin means no CORS, and a content hash in
 * the filename means the browser can cache them forever without ever showing a
 * stale calendar. Venues whose listings did not change keep their hash, and so
 * keep their cache entry, across builds.
 *
 * Files land as public/calendars/<venue-id>.<hash>.ics alongside a manifest.json
 * mapping venue id to filename, which the calendar page reads at build time so
 * the hashed URL is baked into the static HTML.
 *
 * Missing data is not fatal: without a release the manifest is empty and every
 * calendar page renders its empty state, so the site still builds.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const REPO = "clusterflick/data-calendar";
const OUT_DIR = path.join(process.cwd(), "public", "calendars");
// Downloads run against GitHub's asset CDN; a handful at a time keeps the ~336
// files quick without tripping abuse detection.
const CONCURRENCY = 8;

const headers = () => {
  const value = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "clusterflick.com-build",
  };
  // Anonymous requests are rate limited to 60/hour, which a busy CI account can
  // exhaust; the token lifts that to 5000 and is already present in CI.
  const token = process.env.PAT || process.env.GITHUB_TOKEN;
  if (token) value.Authorization = `token ${token}`;
  return value;
};

async function fetchJson(url) {
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

function writeManifest(manifest) {
  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

async function downloadAsset(asset) {
  const response = await fetch(asset.browser_download_url, {
    headers: headers(),
  });
  if (!response.ok) {
    throw new Error(
      `Failed downloading ${asset.name}: ${response.status} ${response.statusText}`,
    );
  }

  const body = await response.text();
  // Sanity check the payload here so a truncated download or an error page
  // fails the build rather than becoming an empty calendar on the site.
  if (!body.startsWith("BEGIN:VCALENDAR")) {
    throw new Error(`${asset.name} is not an ICS file`);
  }

  const hash = crypto
    .createHash("sha256")
    .update(body)
    .digest("hex")
    .slice(0, 10);
  const filename = `${asset.name}.${hash}.ics`;
  fs.writeFileSync(path.join(OUT_DIR, filename), body);

  return [asset.name, filename];
}

async function downloadAll(assets) {
  const queue = [...assets];
  const entries = [];

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, queue.length) },
    async () => {
      let asset;
      while ((asset = queue.shift())) {
        entries.push(await downloadAsset(asset));
      }
    },
  );

  await Promise.all(workers);
  return entries;
}

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let release;
  try {
    release = await fetchJson(
      `https://api.github.com/repos/${REPO}/releases/latest`,
    );
  } catch (error) {
    console.warn(
      `Could not fetch the latest ${REPO} release, skipping: ${error.message}`,
    );
    writeManifest({ tag: null, files: {} });
    return;
  }

  const assets = release.assets || [];
  if (assets.length === 0) {
    console.warn(`Release ${release.tag_name} has no calendar assets.`);
    writeManifest({ tag: release.tag_name, files: {} });
    return;
  }

  const entries = await downloadAll(assets);
  // Sorted so the manifest diffs cleanly between builds
  entries.sort(([a], [b]) => a.localeCompare(b));

  writeManifest({
    tag: release.tag_name,
    files: Object.fromEntries(entries),
  });

  console.log(
    `Downloaded ${entries.length} calendar(s) from ${release.tag_name} to ${OUT_DIR}`,
  );
}

main().catch((error) => {
  console.error(`\n❌ ${error.stack || error.message || error}`);
  process.exit(1);
});
