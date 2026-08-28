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
// The CDN drops the occasional connection mid-run. Retrying is what separates a
// blip from an outage, and a failed build from a slightly slower one.
const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 500;
// No response in 30s is a hung socket, not a slow one; without this a stalled
// connection holds a worker (and the CI job) open indefinitely.
const REQUEST_TIMEOUT_MS = 30_000;
// A download that fails every attempt fails the build. A venue missing from the
// manifest renders an empty calendar, which tells a reader it has no screenings
// — wrong information, not absent information — so shipping a partial set is
// worse than shipping nothing. Deploys run per data release, so a red build
// costs one update and leaves the previous, complete site standing.
const MAX_LOGGED_FAILURES = 10;

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 5xx and 429 are the server asking us to come back later; 4xx is a permanent
// answer that no amount of retrying will change.
const isRetryableStatus = (status) => status === 429 || status >= 500;

/**
 * Fetches a URL and reads its body through `read`, retrying transient network
 * errors and server-side failures with exponential backoff. Network errors
 * surface as a bare `TypeError: fetch failed` with no useful stack, so the
 * label is what makes the log readable.
 *
 * The body is read inside the retried attempt rather than by the caller: a
 * connection dropped part-way through a response is exactly the failure worth
 * retrying, and it happens while streaming, after the headers have arrived.
 */
async function fetchWithRetry(url, label, read) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: headers(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const error = new Error(
          `${label}: ${response.status} ${response.statusText}`,
        );
        // A 4xx is a permanent answer; stop rather than spend three more
        // attempts confirming it.
        error.permanent = !isRetryableStatus(response.status);
        throw error;
      }

      return await read(response);
    } catch (error) {
      if (error.permanent) throw error;
      lastError = error.message.startsWith(label)
        ? error
        : new Error(`${label}: ${error.message}`);
    }

    if (attempt < MAX_ATTEMPTS) {
      // Exponential backoff with jitter, so 8 workers knocked out by the same
      // blip do not all come back at the same instant.
      const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
      await sleep(delay + Math.random() * RETRY_BASE_MS);
    }
  }

  throw lastError;
}

const fetchJson = (url) =>
  fetchWithRetry(url, url, (response) => response.json());

function writeManifest(manifest) {
  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

async function downloadAsset(asset) {
  const body = await fetchWithRetry(
    asset.browser_download_url,
    `Failed downloading ${asset.name}`,
    async (response) => {
      const text = await response.text();
      // Sanity check the payload here so a truncated download or an error page
      // is retried, and ultimately fails, rather than becoming an empty
      // calendar on the site.
      if (!text.startsWith("BEGIN:VCALENDAR")) {
        throw new Error(`${asset.name} is not an ICS file`);
      }
      return text;
    },
  );

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
  const failures = [];

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, queue.length) },
    async () => {
      let asset;
      while ((asset = queue.shift())) {
        // One venue failing must not abandon the rest of the downloads, so
        // each is settled independently and judged collectively below.
        try {
          entries.push(await downloadAsset(asset));
        } catch (error) {
          failures.push({ name: asset.name, message: error.message });
        }
      }
    },
  );

  await Promise.all(workers);
  return { entries, failures };
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

  const { entries, failures } = await downloadAll(assets);
  // Sorted so the manifest diffs cleanly between builds
  entries.sort(([a], [b]) => a.localeCompare(b));

  if (failures.length > 0) {
    // Every failure is reported, not just the one that happened to land first,
    // so a single log says whether this was one flaky venue or an outage.
    // Capped, because an outage fails every asset at once and hundreds of
    // identical lines bury the summary that explains the exit code.
    console.error(
      `\n${failures.length} of ${assets.length} calendar(s) could not be downloaded after ${MAX_ATTEMPTS} attempts:`,
    );
    for (const { message } of failures.slice(0, MAX_LOGGED_FAILURES)) {
      console.error(`   - ${message}`);
    }
    if (failures.length > MAX_LOGGED_FAILURES) {
      console.error(
        `   - ...and ${failures.length - MAX_LOGGED_FAILURES} more`,
      );
    }
    throw new Error(
      `${failures.length} of ${assets.length} calendar downloads failed.`,
    );
  }

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
