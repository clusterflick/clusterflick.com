/* eslint-disable */
/**
 * Downloads the most recent data-diffed releases into ./diffed-data/.
 *
 * Unlike combined and matched data, the updates feed needs a window of releases
 * rather than just the latest one — each release describes a single pipeline run,
 * so a page covering the last couple of weeks needs one file per run. Releases
 * are only published when something actually changed, so the window is "the last
 * N releases", not "the last N days".
 *
 * Files land as diffed-data/<tag>.json. Missing data is not fatal: the feed
 * degrades to however many releases exist (there were three on day one), and to
 * an empty page if the repo has none at all, so the site still builds.
 */
const fs = require("node:fs");
const path = require("node:path");

const REPO = "clusterflick/data-diffed";
const DEFAULT_LIMIT = 25;
const OUT_DIR = path.join(process.cwd(), "diffed-data");

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

async function main() {
  const limit = parseInt(process.env.DIFFED_DATA_LIMIT || DEFAULT_LIMIT, 10);

  let releases;
  try {
    releases = await fetchJson(
      `https://api.github.com/repos/${REPO}/releases?per_page=${limit}`,
    );
  } catch (error) {
    console.warn(`Could not list ${REPO} releases, skipping: ${error.message}`);
    return;
  }

  if (!Array.isArray(releases) || releases.length === 0) {
    console.warn(`No ${REPO} releases found; the updates feed will be empty.`);
    return;
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let downloaded = 0;
  for (const release of releases.slice(0, limit)) {
    const asset = (release.assets || []).find(
      ({ name }) => name === "diffed-data.json",
    );
    if (!asset) {
      console.warn(`Release ${release.tag_name} has no diffed-data.json`);
      continue;
    }

    const response = await fetch(asset.browser_download_url, {
      headers: headers(),
    });
    if (!response.ok) {
      throw new Error(
        `Failed downloading ${release.tag_name}: ${response.status} ${response.statusText}`,
      );
    }

    const body = await response.text();
    // Parse before writing so a truncated download fails here rather than
    // halfway through the site build
    JSON.parse(body);

    fs.writeFileSync(path.join(OUT_DIR, `${release.tag_name}.json`), body);
    downloaded++;
  }

  console.log(`Downloaded ${downloaded} diffed-data release(s) to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(`\n❌ ${error.stack || error.message || error}`);
  process.exit(1);
});
