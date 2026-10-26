/* eslint-disable */
/**
 * Downloads the two datasets published for reuse into ./public/datasets/, so
 * they are served from clusterflick.com rather than from a GitHub release:
 *
 *   datasets/venues/<venue-id>.json     from clusterflick/data-transformed
 *   datasets/calendars/<venue-id>.ics   from clusterflick/data-calendar
 *   datasets/schema.json                the JSON files' schema, from
 *                                       clusterflick/scripts
 *   datasets/index.json                 every venue, its files, and the releases
 *
 * The index describes each venue as well as naming its files - name, type,
 * address, coordinates and its page here - because a file named after a domain
 * says nothing about where the cinema is. Those come from the combined data,
 * which the workflow downloads before this runs.
 *
 * Both releases name each asset after the venue id with no extension
 * (`actonecinema.co.uk`). The names here are stable rather than content-hashed,
 * because they are addresses other people link to and subscribe to: the data
 * licence page and the venue pages' calendar subscriptions point at them, and
 * the site's own calendar page loads the same URL a subscriber does. Freshness
 * is Cloudflare's cache rule for this path, not the filename.
 *
 * Deliberately not under `data/`, which holds the site's own content-hashed
 * listing chunks: those are internal, cached forever and carried forward
 * between deploys, and these are none of that. A directory of their own gives
 * them one cache rule, and lets this script own everything in it.
 *
 * A download that fails every attempt fails the build, and so does a release
 * that can't be listed. A venue missing here is a published file that 404s for
 * anyone who relied on it, and on the calendar page an empty calendar, which
 * tells a reader it has no screenings - wrong information, not absent
 * information. Deploys run per data release, so a red build costs one update
 * and leaves the previous, complete set standing. Only a release that doesn't
 * exist at all (a 404) is let through, as an empty dataset: every venue is then
 * equally empty and the index says so plainly.
 */
const fs = require("node:fs");
const path = require("node:path");

const OUT_DIR = path.join(process.cwd(), "public", "datasets");
const INDEX_PATH = path.join(OUT_DIR, "index.json");
const SCHEMA_PATH = path.join(OUT_DIR, "schema.json");
const COMBINED_DATA_PATH = path.join(
  process.cwd(),
  "combined-data",
  "combined-data.json",
);
const SITE = "https://clusterflick.com";

// The schema `transform` validates every venue's output against before it is
// released, so it describes the files as published. Read from main because
// that is what the pipeline runs.
const SCHEMA = {
  repository: "clusterflick/scripts",
  path: "schema.json",
  url: "https://raw.githubusercontent.com/clusterflick/scripts/main/schema.json",
};

const DATASETS = [
  {
    key: "data",
    repo: "clusterflick/data-transformed",
    dir: "venues",
    extension: "json",
    // Sanity check the payload so a truncated download or an error page is
    // retried, and ultimately fails, rather than being published.
    validate: (text, name) => {
      if (!Array.isArray(JSON.parse(text))) {
        throw new Error(`${name} is not a JSON array`);
      }
    },
  },
  {
    key: "calendar",
    repo: "clusterflick/data-calendar",
    dir: "calendars",
    extension: "ics",
    validate: (text, name) => {
      if (!text.startsWith("BEGIN:VCALENDAR")) {
        throw new Error(`${name} is not an ICS file`);
      }
    },
  },
];

// Downloads run against GitHub's asset CDN; a handful at a time keeps the ~900
// files quick without tripping abuse detection.
const CONCURRENCY = 8;
// The CDN drops the occasional connection mid-run. Retrying is what separates a
// blip from an outage, and a failed build from a slightly slower one.
const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 500;
// No response in 30s is a hung socket, not a slow one; without this a stalled
// connection holds a worker (and the CI job) open indefinitely.
const REQUEST_TIMEOUT_MS = 30_000;
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
async function fetchWithRetry(url, label, read, requestHeaders = headers()) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: requestHeaders,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const error = new Error(
          `${label}: ${response.status} ${response.statusText}`,
        );
        // A 4xx is a permanent answer; stop rather than spend three more
        // attempts confirming it.
        error.permanent = !isRetryableStatus(response.status);
        error.status = response.status;
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

async function getLatestRelease(repo) {
  try {
    return await fetchJson(
      `https://api.github.com/repos/${repo}/releases/latest`,
    );
  } catch (error) {
    if (error.status !== 404) throw error;
    console.warn(`${repo} has no published release.`);
    return null;
  }
}

async function downloadAsset(dataset, asset) {
  const body = await fetchWithRetry(
    asset.browser_download_url,
    `Failed downloading ${dataset.repo} ${asset.name}`,
    async (response) => {
      const text = await response.text();
      dataset.validate(text, asset.name);
      return text;
    },
  );

  const publishedPath = `/datasets/${dataset.dir}/${asset.name}.${dataset.extension}`;
  fs.writeFileSync(path.join(process.cwd(), "public", publishedPath), body);
  return { venueId: asset.name, key: dataset.key, publishedPath };
}

async function downloadAll(jobs) {
  const queue = [...jobs];
  const entries = [];
  const failures = [];

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, queue.length) },
    async () => {
      let job;
      while ((job = queue.shift())) {
        // One venue failing must not abandon the rest of the downloads, so
        // each is settled independently and judged collectively below.
        try {
          entries.push(await downloadAsset(job.dataset, job.asset));
        } catch (error) {
          failures.push(error.message);
        }
      }
    },
  );

  await Promise.all(workers);
  return { entries, failures };
}

async function downloadSchema() {
  const body = await fetchWithRetry(
    SCHEMA.url,
    `Failed downloading ${SCHEMA.repository} ${SCHEMA.path}`,
    async (response) => {
      const text = await response.text();
      if (JSON.parse(text).type !== "array") {
        throw new Error(`${SCHEMA.path} does not describe a JSON array`);
      }
      return text;
    },
    // A public file needs no token, and one GitHub doesn't accept for this
    // repository turns the answer into a 404
    { "User-Agent": "clusterflick.com-build" },
  );
  fs.writeFileSync(SCHEMA_PATH, body);
}

/**
 * What the index says about each venue. Only the venue's public facts: the
 * pipeline's own bookkeeping (structure, programming) and the social handles
 * are left out, being either internal or someone else's to publish.
 */
async function getVenueDetails() {
  if (!fs.existsSync(COMBINED_DATA_PATH)) {
    throw new Error(
      `${COMBINED_DATA_PATH} not found - download the latest clusterflick/data-combined release first.`,
    );
  }
  const { venues } = JSON.parse(fs.readFileSync(COMBINED_DATA_PATH, "utf-8"));
  // ESM-only; the same slug `getVenueUrl` builds a venue page's address from
  const { default: slugify } = await import("@sindresorhus/slugify");

  const details = {};
  for (const [id, venue] of Object.entries(venues)) {
    details[id] = {
      name: venue.name,
      type: venue.type,
      ...(venue.groupName ? { groupName: venue.groupName } : {}),
      address: venue.address,
      geo: venue.geo,
      url: venue.url,
      page: `${SITE}/venues/${slugify(venue.name)}/`,
    };
  }
  return details;
}

async function main() {
  // Read before anything is deleted, so a missing download leaves the last
  // set in place locally
  const venueDetails = await getVenueDetails();

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  for (const { dir } of DATASETS) {
    fs.mkdirSync(path.join(OUT_DIR, dir), { recursive: true });
  }

  const releases = {};
  const jobs = [];
  for (const dataset of DATASETS) {
    const release = await getLatestRelease(dataset.repo);
    releases[dataset.key] = release
      ? {
          repository: dataset.repo,
          tag: release.tag_name,
          publishedAt: release.published_at,
        }
      : null;
    for (const asset of release?.assets || []) {
      jobs.push({ dataset, asset });
    }
  }

  const { entries, failures } = await downloadAll(jobs);
  try {
    await downloadSchema();
  } catch (error) {
    failures.push(error.message);
  }

  if (failures.length > 0) {
    // Every failure is reported, not just the one that happened to land first,
    // so a single log says whether this was one flaky venue or an outage.
    // Capped, because an outage fails every asset at once and hundreds of
    // identical lines bury the summary that explains the exit code.
    console.error(
      `\n${failures.length} of ${jobs.length + 1} file(s) could not be downloaded after ${MAX_ATTEMPTS} attempts:`,
    );
    for (const message of failures.slice(0, MAX_LOGGED_FAILURES)) {
      console.error(`   - ${message}`);
    }
    if (failures.length > MAX_LOGGED_FAILURES) {
      console.error(
        `   - ...and ${failures.length - MAX_LOGGED_FAILURES} more`,
      );
    }
    throw new Error(
      `${failures.length} of ${jobs.length + 1} downloads failed.`,
    );
  }

  const venues = {};
  // Sorted so the index diffs cleanly between builds
  entries.sort(
    (a, b) => a.venueId.localeCompare(b.venueId) || a.key.localeCompare(b.key),
  );
  for (const { venueId, key, publishedPath } of entries) {
    venues[venueId] = venues[venueId] || {};
    venues[venueId][key] = publishedPath;
  }

  // A venue with files but no details would be the gap this index exists to
  // fill. The releases come from the same pipeline run, so this is a mismatch
  // to look into rather than to publish around.
  const undescribed = Object.keys(venues).filter((id) => !venueDetails[id]);
  if (undescribed.length > 0) {
    throw new Error(
      `${undescribed.length} venue(s) have published files but no details in the combined data: ${undescribed.join(", ")}`,
    );
  }
  for (const id of Object.keys(venues)) {
    venues[id] = { ...venueDetails[id], ...venues[id] };
  }

  // Written last, so an index only ever describes a complete download.
  fs.writeFileSync(
    INDEX_PATH,
    `${JSON.stringify(
      {
        licence: "CC BY 4.0",
        licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
        terms: "https://clusterflick.com/data-licence/",
        generatedAt: new Date().toISOString(),
        releases,
        schema: "/datasets/schema.json",
        venues,
      },
      null,
      2,
    )}\n`,
  );

  for (const dataset of DATASETS) {
    const count = entries.filter(({ key }) => key === dataset.key).length;
    console.log(
      `Downloaded ${count} file(s) from ${dataset.repo} ${releases[dataset.key]?.tag ?? "(no release)"} to public/datasets/${dataset.dir}`,
    );
  }
}

main().catch((error) => {
  console.error(`\n❌ ${error.stack || error.message || error}`);
  process.exit(1);
});
