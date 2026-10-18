/* eslint-disable */
/**
 * Copies the previous deploys' `_next/static` files and listings data into this
 * build's output, so HTML from an earlier build can still load its JavaScript
 * and the data that JavaScript asks for.
 *
 * GitHub Pages replaces the whole site on deploy, so an older build's chunks
 * 404 the moment a new one goes live. Old HTML outlives them: GitHub's proxy
 * has been seen serving a page from the previous build minutes after a deploy
 * (and after its own `expires`), and an open tab carries its build's chunk
 * graph until it reloads. Either asks for a chunk that's gone, and the page
 * falls over with a ChunkLoadError. Cloudflare doesn't cover the gap: its
 * cache is per data centre, so an edge that never served a chunk has nothing
 * to fall back on.
 *
 * The JavaScript is only half of it. Each build bakes the name of its own
 * meta blob in (`NEXT_PUBLIC_DATA_FILENAME`), so a previous build's page loads
 * its chunks, asks for `data/data.meta.<old hash>.json`, gets a 404 and shows
 * "Something went wrong" until the stale HTML expires. The smoke tests hit
 * exactly that on /catalogue two minutes after a deploy. So the hashed data
 * files - the meta blob and the movie chunks it names - are carried too. A
 * build's data is ~11MB, and a chunk that didn't change keeps its name and
 * costs nothing. Unhashed files in `data/` (`collections.json`) are never
 * carried: a name shared across builds can't say which build it belongs to.
 *
 * Everything carried is named by content hash or build id, so files from
 * different builds never collide and carrying old ones forward costs only
 * bytes. This build's own files always win.
 *
 * The history lives in ./static-history/<run id>/, laid out as `out/` is
 * (`_next/static/...` and `data/...`), one copy per deploy, restored from the
 * Actions cache. A run saved before the data was carried holds `_next/static`'s
 * contents at its top level, and is read as such. The deploy job saves it again
 * only once the deploy has succeeded, so a build that never went live is never
 * carried. A missing history (the first run, or an evicted cache) carries
 * nothing: that is today's behaviour, not a reason to block a deploy.
 */
const fs = require("node:fs");
const path = require("node:path");

const OUT_DIR = path.join(process.cwd(), "out");
const STATIC_PATH = path.join("_next", "static");
const DATA_PATH = "data";
const STATIC_DIR = path.join(OUT_DIR, STATIC_PATH);
const DATA_DIR = path.join(OUT_DIR, DATA_PATH);
// What process-combined-data.js names by content hash: the meta blob and the
// movie chunks it lists.
const HASHED_DATA_FILE = /^data\.(meta|\d+)\.[0-9a-f]{10}\.json$/;
const HISTORY_DIR = path.join(process.cwd(), "static-history");
// This build plus the two before it. Deploys are hours apart, and stale HTML
// has been seen for minutes, so two previous builds is plenty of margin.
const KEEP_BUILDS = 3;

function listFiles(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, base);
    return [path.relative(base, full)];
  });
}

function main() {
  const runId = process.env.GITHUB_RUN_ID;
  if (!runId) throw new Error("GITHUB_RUN_ID is not set");
  for (const dir of [STATIC_DIR, DATA_DIR]) {
    if (!fs.existsSync(dir)) {
      throw new Error(`${dir} does not exist; run the build first`);
    }
  }

  fs.mkdirSync(HISTORY_DIR, { recursive: true });
  const previous = fs
    .readdirSync(HISTORY_DIR)
    .filter((name) => /^\d+$/.test(name) && name !== runId)
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, KEEP_BUILDS - 1);

  // Snapshot this build's own files before anything is merged into them, so
  // the history holds each build exactly once.
  const current = path.join(HISTORY_DIR, runId);
  fs.rmSync(current, { recursive: true, force: true });
  fs.cpSync(STATIC_DIR, path.join(current, STATIC_PATH), { recursive: true });
  fs.mkdirSync(path.join(current, DATA_PATH), { recursive: true });
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!HASHED_DATA_FILE.test(file)) continue;
    fs.copyFileSync(
      path.join(DATA_DIR, file),
      path.join(current, DATA_PATH, file),
    );
  }

  if (previous.length === 0) {
    console.log("No previous builds in the history; nothing carried forward");
  }
  for (const build of previous) {
    const buildDir = path.join(HISTORY_DIR, build);
    // Saved before the data was carried: `_next/static`'s contents, unwrapped.
    const legacy = !fs.existsSync(path.join(buildDir, "_next"));
    let carried = 0;
    for (const file of listFiles(buildDir)) {
      const target = path.join(legacy ? STATIC_DIR : OUT_DIR, file);
      if (fs.existsSync(target)) continue;
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(buildDir, file), target);
      carried++;
    }
    console.log(`Carried forward ${carried} files from run ${build}`);
  }

  const kept = new Set([runId, ...previous]);
  for (const name of fs.readdirSync(HISTORY_DIR)) {
    if (kept.has(name)) continue;
    fs.rmSync(path.join(HISTORY_DIR, name), { recursive: true, force: true });
    console.log(`Dropped run ${name} from the history`);
  }
}

main();
