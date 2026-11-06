/* eslint-disable */
/**
 * Downloads the record of every release of the two published datasets into
 * ./release-log/release-log.json, for the data status page
 * (/datasets/status/).
 *
 * The record is clusterflick/data-analysed's release log: one
 * `release-log.jsonl` a month, on its `release-log-YYYYMM` release, a row per
 * release of `data-transformed` or `data-calendar` - `{ dataset, repository,
 * tag, publishedAt }`. Each dataset dispatches it as it publishes. It is read
 * here rather than rebuilt from the releases API because it is the record: it
 * survives a release being deleted, and it is one small file a month rather
 * than thousands of releases, each listing ~450 assets.
 *
 * Every month from the first release to this one is fetched by name. A month
 * missing from that run is a hole in the history the page would show as days
 * without a release, so it fails the build, as does any download that fails.
 * The one exception is this month's: in its first hours, before anything has
 * been released, its log doesn't exist yet.
 *
 * Kept out of public/: the history is read at build time and drawn into the
 * page, not offered as a file of its own.
 */
const fs = require("node:fs");
const path = require("node:path");

const REPO = "clusterflick/data-analysed";
const ASSET = "release-log.jsonl";
// The month of the first release of either dataset, in London time as the log
// files its months
const FIRST_MONTH = { year: 2025, month: 2 };
const OUT_DIR = path.join(process.cwd(), "release-log");
const OUT_PATH = path.join(OUT_DIR, "release-log.json");

const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 500;
const REQUEST_TIMEOUT_MS = 30_000;

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

// The same retry rules as fetch-published-data.js: back off on a 5xx, a 429
// or a dropped connection, and stop at once on any other 4xx.
async function fetchWithRetry(url, read, requestHeaders = headers()) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: requestHeaders,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        const error = new Error(
          `${url}: ${response.status} ${response.statusText}`,
        );
        error.status = response.status;
        error.permanent = response.status !== 429 && response.status < 500;
        throw error;
      }
      return await read(response);
    } catch (error) {
      if (error.permanent) throw error;
      lastError = error;
    }

    if (attempt < MAX_ATTEMPTS) {
      const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
      await sleep(delay + Math.random() * RETRY_BASE_MS);
    }
  }

  throw lastError;
}

/** Every `YYYYMM` from the first release's month to this one, in London. */
function getMonths(now) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const current = {
    year: Number(parts.find((p) => p.type === "year").value),
    month: Number(parts.find((p) => p.type === "month").value),
  };

  const months = [];
  let { year, month } = FIRST_MONTH;
  while (year * 12 + month <= current.year * 12 + current.month) {
    months.push(`${year}${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      year += 1;
      month = 1;
    }
  }
  return months;
}

async function fetchMonth(month, isCurrent) {
  const tag = `release-log-${month}`;
  let release;
  try {
    release = await fetchWithRetry(
      `https://api.github.com/repos/${REPO}/releases/tags/${tag}`,
      (response) => response.json(),
    );
  } catch (error) {
    if (error.status === 404 && isCurrent) {
      console.warn(`${REPO} has no ${tag} yet - nothing released this month.`);
      return [];
    }
    throw error;
  }

  const asset = release.assets.find(({ name }) => name === ASSET);
  if (!asset) {
    throw new Error(`${REPO} ${tag} has no ${ASSET}`);
  }

  const text = await fetchWithRetry(
    asset.browser_download_url,
    (response) => response.text(),
    // A public asset needs no token
    { "User-Agent": "clusterflick.com-build" },
  );
  return text
    .trimEnd()
    .split("\n")
    .filter(Boolean)
    .map((line, index) => {
      const row = JSON.parse(line);
      if (!row.dataset || !row.tag || !row.publishedAt) {
        throw new Error(`${tag} ${ASSET} line ${index + 1} is not a release`);
      }
      return row;
    });
}

async function main() {
  const months = getMonths(new Date());
  const rows = [];
  for (const [index, month] of months.entries()) {
    rows.push(...(await fetchMonth(month, index === months.length - 1)));
  }
  rows.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(rows)}\n`);
  console.log(
    `Downloaded ${rows.length} release(s) across ${months.length} month(s) to ${path.relative(process.cwd(), OUT_PATH)}`,
  );
}

main().catch((error) => {
  console.error(`\n❌ ${error.stack || error.message || error}`);
  process.exit(1);
});
