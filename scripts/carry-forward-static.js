/* eslint-disable */
/**
 * Copies the previous deploys' `_next/static` files into this build's output,
 * so HTML from an earlier build can still load its JavaScript.
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
 * Everything under `_next/static` is named by content hash or build id, so
 * files from different builds never collide and carrying old ones forward
 * costs only bytes. This build's own files always win.
 *
 * The history lives in ./static-history/<run id>/, one copy of `_next/static`
 * per deploy, restored from the Actions cache. The deploy job saves it again
 * only once the deploy has succeeded, so a build that never went live is never
 * carried. A missing history (the first run, or an evicted cache) carries
 * nothing: that is today's behaviour, not a reason to block a deploy.
 */
const fs = require("node:fs");
const path = require("node:path");

const STATIC_DIR = path.join(process.cwd(), "out", "_next", "static");
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
  if (!fs.existsSync(STATIC_DIR)) {
    throw new Error(`${STATIC_DIR} does not exist; run the build first`);
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
  fs.cpSync(STATIC_DIR, current, { recursive: true });

  if (previous.length === 0) {
    console.log("No previous builds in the history; nothing carried forward");
  }
  for (const build of previous) {
    const buildDir = path.join(HISTORY_DIR, build);
    let carried = 0;
    for (const file of listFiles(buildDir)) {
      const target = path.join(STATIC_DIR, file);
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
