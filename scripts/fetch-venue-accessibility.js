/* eslint-disable */
/**
 * Downloads the latest clusterflick/venue-accessibility release into
 * ./venue-accessibility/venue-accessibility.json, for the venue pages' access
 * sections (see src/utils/get-venue-accessibility.ts).
 *
 * The deploy and CI fetch the same file with the download-release action; this
 * is the same download for a local build, run by
 * scripts/get-latest-release-assets.sh.
 *
 * A repository with no release yet is not an error: it is what every build saw
 * before the first one, and the venue pages then have no access section, as
 * they would for a missing file. Anything else that goes wrong fails, and
 * leaves the last copy downloaded where it was.
 */
const fs = require("node:fs");
const path = require("node:path");

const REPO = "clusterflick/venue-accessibility";
const ASSET = "venue-accessibility.json";
const OUT_DIR = path.join(process.cwd(), "venue-accessibility");

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

async function main() {
  const url = `https://api.github.com/repos/${REPO}/releases/latest`;
  const response = await fetch(url, { headers: headers() });

  if (response.status === 404) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    console.warn(
      `${REPO} has no release yet; venue pages will have no access section.`,
    );
    return;
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  const release = await response.json();
  const asset = (release.assets || []).find(({ name }) => name === ASSET);
  if (!asset) {
    throw new Error(`Release ${release.tag_name} of ${REPO} has no ${ASSET}`);
  }

  const download = await fetch(asset.browser_download_url, {
    headers: headers(),
  });
  if (!download.ok) {
    throw new Error(
      `Failed downloading ${ASSET} from ${release.tag_name}: ${download.status} ${download.statusText}`,
    );
  }

  const body = await download.text();
  // Parse before writing so a truncated download fails here rather than
  // halfway through the site build
  const { venues } = JSON.parse(body);

  // Replaced only once the new copy is in hand, so a failed run leaves the
  // last good one rather than none
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, ASSET), body);
  console.log(
    `Downloaded ${ASSET} from ${release.tag_name} (${Object.keys(venues).length} venues)`,
  );
}

main().catch((error) => {
  console.error(`\n❌ ${error.stack || error.message || error}`);
  process.exit(1);
});
