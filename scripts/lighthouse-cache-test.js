#!/usr/bin/env node
/**
 * Lighthouse cache comparison test for clusterflick.com
 *
 * Runs Lighthouse against the site twice: once with a cold cache and once with
 * a warm cache (reusing the same Chrome profile so cached assets persist).
 * Outputs HTML reports, a JSON data file, and a blog-ready markdown summary.
 *
 * Prerequisites:
 *   npm install --save-dev lighthouse chrome-launcher
 *
 * Usage:
 *   node scripts/lighthouse-cache-test.js [options]
 *
 * Options:
 *   --url <url>       Target URL          (default: https://clusterflick.com)
 *   --runs <n>        Runs to average     (default: 1)
 *   --preset <name>   mobile | desktop    (default: mobile)
 *   --out <dir>       Output directory    (default: lighthouse-results)
 */

"use strict";

/* eslint @typescript-eslint/no-require-imports: 0 */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = argv.indexOf(flag);
  return i !== -1 ? argv[i + 1] : def;
};

const TARGET_URL = getArg("--url", "https://clusterflick.com");
const RUNS = parseInt(getArg("--runs", "1"), 10);
const PRESET = getArg("--preset", "mobile"); // "mobile" | "desktop"
const OUT_DIR = getArg("--out", "lighthouse-results");

fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Terminal colours
// ---------------------------------------------------------------------------

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

/** Wrap text in an ANSI colour, then pad the *visible* content to `width` chars. */
function colorPad(text, colorName, width) {
  const plain = String(text);
  const padding = " ".repeat(Math.max(0, width - plain.length));
  if (!colorName) return plain + padding;
  return `${C[colorName]}${plain}${C.reset}${padding}`;
}

const clr = (colorName, text) => `${C[colorName]}${text}${C.reset}`;

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

const fmtMs = (v) =>
  v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`;
const fmtKB = (v) => (v >= 1024 ? `${(v / 1024).toFixed(1)} MB` : `${v} KB`);
const scoreColor = (s) => (s >= 90 ? "green" : s >= 50 ? "yellow" : "red");

// ---------------------------------------------------------------------------
// Find Playwright's bundled Chromium (avoids needing a separate Chrome install)
// ---------------------------------------------------------------------------

function getChromePath() {
  try {
    const { chromium } = require("playwright");
    const p = chromium.executablePath();
    if (fs.existsSync(p)) {
      console.log(clr("gray", `  Chromium: ${p}`));
      return p;
    }
  } catch {
    // playwright not available
  }
  console.log(clr("gray", "  Chromium: system Chrome"));
  return undefined;
}

// ---------------------------------------------------------------------------
// Lighthouse runner
// ---------------------------------------------------------------------------

async function runLighthouse(url, { warm, userDataDir, chromePath }) {
  const chromeLauncher = require("chrome-launcher");
  const { default: lighthouse } = await import("lighthouse");

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--no-sandbox", "--disable-gpu"],
    chromePath,
    userDataDir,
  });

  try {
    const flags = {
      port: chrome.port,
      output: ["html", "json"],
      logLevel: "error",
      // When warm=true, skip clearing cache/storage so the previous run's
      // cached assets are reused, simulating a returning visitor.
      disableStorageReset: warm,
    };

    // Desktop overrides (lighthouse:default is mobile)
    const config =
      PRESET === "desktop"
        ? {
            extends: "lighthouse:default",
            settings: {
              formFactor: "desktop",
              throttling: {
                rttMs: 40,
                throughputKbps: 10 * 1024,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0,
              },
              screenEmulation: {
                mobile: false,
                width: 1350,
                height: 940,
                deviceScaleFactor: 1,
                disabled: false,
              },
              emulatedUserAgent:
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          }
        : null;

    return await lighthouse(url, flags, config);
  } finally {
    await chrome.kill();
  }
}

// ---------------------------------------------------------------------------
// Metric extraction
// ---------------------------------------------------------------------------

function extractMetrics(lhr) {
  const audit = (id) => lhr.audits[id];
  const ms = (id) => Math.round(audit(id)?.numericValue ?? 0);

  const requests = audit("network-requests")?.details?.items ?? [];
  const totalTransferBytes = requests.reduce(
    (sum, r) => sum + (r.transferSize ?? 0),
    0,
  );
  // A request is "from cache" if the server sent 0 bytes (304 / memory/disk cache)
  const cachedRequests = requests.filter(
    (r) => r.statusCode !== -1 && (r.transferSize ?? 0) === 0,
  ).length;

  return {
    score: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    fcp: ms("first-contentful-paint"),
    lcp: ms("largest-contentful-paint"),
    tbt: ms("total-blocking-time"),
    cls: parseFloat(
      (audit("cumulative-layout-shift")?.numericValue ?? 0).toFixed(3),
    ),
    si: ms("speed-index"),
    tti: ms("interactive"),
    transferKB: Math.round(totalTransferBytes / 1024),
    requests: requests.length,
    cachedRequests,
  };
}

function average(list) {
  return Object.fromEntries(
    Object.keys(list[0]).map((k) => [
      k,
      k === "cls"
        ? parseFloat(
            (list.reduce((a, m) => a + m[k], 0) / list.length).toFixed(3),
          )
        : Math.round(list.reduce((a, m) => a + m[k], 0) / list.length),
    ]),
  );
}

// ---------------------------------------------------------------------------
// Terminal dashboard
// ---------------------------------------------------------------------------

function printDashboard(cold, warm) {
  const W = 72;

  console.log("");
  console.log(clr("cyan", clr("bold", "═".repeat(W))));
  console.log(
    clr("cyan", clr("bold", "  CLUSTERFLICK — LIGHTHOUSE CACHE COMPARISON")),
  );
  console.log(
    clr(
      "cyan",
      clr(
        "bold",
        `  ${TARGET_URL}  ·  ${PRESET}  ·  ${RUNS} run${RUNS > 1 ? "s" : ""} averaged`,
      ),
    ),
  );
  console.log(clr("cyan", clr("bold", "═".repeat(W))));
  console.log("");

  const LW = 30; // label column width
  const VW = 12; // value column width

  // Header row
  console.log(
    clr(
      "bold",
      `  ${"Metric".padEnd(LW)}  ${"Cold Cache".padEnd(VW)}  ${"Warm Cache".padEnd(VW)}  Change`,
    ),
  );
  console.log(`  ${"─".repeat(W - 2)}`);

  // Performance score (higher is better — special treatment for colour)
  const scoreDiff = warm.score - cold.score;
  const scoreDiffStr =
    scoreDiff > 0
      ? clr("green", `+${scoreDiff} pts`)
      : scoreDiff < 0
        ? clr("red", `${scoreDiff} pts`)
        : clr("gray", "—");
  console.log(
    `  ${"Performance Score".padEnd(LW)}  ${colorPad(cold.score, scoreColor(cold.score), VW)}  ${colorPad(warm.score, scoreColor(warm.score), VW)}  ${scoreDiffStr}`,
  );

  console.log(`  ${"·".repeat(W - 2)}`);

  function row(label, coldVal, warmVal, fmt, lowerBetter = true) {
    const coldStr = fmt(coldVal);
    const warmStr = fmt(warmVal);
    const pct = coldVal
      ? ((lowerBetter ? coldVal - warmVal : warmVal - coldVal) / coldVal) * 100
      : null;
    let changeStr;
    if (pct === null) {
      changeStr = clr("gray", "—");
    } else if (Math.abs(pct) < 0.5) {
      changeStr = clr("gray", "—");
    } else if (pct > 0) {
      changeStr = clr("green", `▲ ${Math.round(pct)}%`);
    } else {
      changeStr = clr("red", `▼ ${Math.round(Math.abs(pct))}%`);
    }
    console.log(
      `  ${label.padEnd(LW)}  ${coldStr.padEnd(VW)}  ${warmStr.padEnd(VW)}  ${changeStr}`,
    );
  }

  row("First Contentful Paint", cold.fcp, warm.fcp, fmtMs);
  row("Largest Contentful Paint", cold.lcp, warm.lcp, fmtMs);
  row("Total Blocking Time", cold.tbt, warm.tbt, fmtMs);
  row("Speed Index", cold.si, warm.si, fmtMs);
  row("Time to Interactive", cold.tti, warm.tti, fmtMs);
  row("Cumulative Layout Shift", cold.cls, warm.cls, (v) => v.toFixed(3));

  console.log(`  ${"·".repeat(W - 2)}`);

  row("Transfer Size", cold.transferKB, warm.transferKB, fmtKB);
  row("Total Requests", cold.requests, warm.requests, String);
  // Cached requests is warm-only; show as a plain info line
  console.log(
    `  ${"Served from Cache".padEnd(LW)}  ${"—".padEnd(VW)}  ${`${warm.cachedRequests} / ${warm.requests} requests`.padEnd(VW)}`,
  );

  console.log(`  ${"─".repeat(W - 2)}`);
  console.log("");
}

// ---------------------------------------------------------------------------
// Blog markdown summary
// ---------------------------------------------------------------------------

function generateBlogSummary(cold, warm) {
  const savedKB = cold.transferKB - warm.transferKB;
  const savedPct = cold.transferKB
    ? Math.round((savedKB / cold.transferKB) * 100)
    : 0;
  const scoreDiff = warm.score - cold.score;
  const dateStr = new Date().toLocaleDateString("en-GB", { dateStyle: "long" });

  return `# Clusterflick Cache Performance Analysis

**URL:** ${TARGET_URL}
**Preset:** ${PRESET}
**Runs averaged:** ${RUNS}
**Date:** ${dateStr}

## Performance Score

| | Cold Cache | Warm Cache | Change |
|---|---|---|---|
| Lighthouse Score | ${cold.score}/100 | ${warm.score}/100 | ${scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} points |

## Core Web Vitals

| Metric | Cold Cache | Warm Cache | Improvement |
|---|---|---|---|
| First Contentful Paint | ${fmtMs(cold.fcp)} | ${fmtMs(warm.fcp)} | ${fmtMs(cold.fcp - warm.fcp)} faster |
| Largest Contentful Paint | ${fmtMs(cold.lcp)} | ${fmtMs(warm.lcp)} | ${fmtMs(cold.lcp - warm.lcp)} faster |
| Total Blocking Time | ${fmtMs(cold.tbt)} | ${fmtMs(warm.tbt)} | ${fmtMs(cold.tbt - warm.tbt)} faster |
| Speed Index | ${fmtMs(cold.si)} | ${fmtMs(warm.si)} | ${fmtMs(cold.si - warm.si)} faster |
| Time to Interactive | ${fmtMs(cold.tti)} | ${fmtMs(warm.tti)} | ${fmtMs(cold.tti - warm.tti)} faster |
| Cumulative Layout Shift | ${cold.cls} | ${warm.cls} | ${cold.cls === warm.cls ? "No change" : cold.cls > warm.cls ? "Better" : "Worse"} |

## Network Efficiency

| Metric | Cold Cache | Warm Cache |
|---|---|---|
| Transfer Size | ${fmtKB(cold.transferKB)} | ${fmtKB(warm.transferKB)} |
| Total Requests | ${cold.requests} | ${warm.requests} |
| Served from Cache | — | ${warm.cachedRequests} of ${warm.requests} requests |
| Data Saved | — | ${fmtKB(savedKB)} (${savedPct}% reduction) |

## Key Takeaways

- Returning visitors download **${savedPct}% less data** (${fmtKB(savedKB)} saved per visit)
- Largest Contentful Paint improves by **${fmtMs(cold.lcp - warm.lcp)}** (${fmtMs(cold.lcp)} → ${fmtMs(warm.lcp)})
- ${warm.cachedRequests} of ${warm.requests} network requests are served from cache on repeat visits
- Performance score ${scoreDiff > 0 ? `improves by ${scoreDiff} points` : scoreDiff < 0 ? `drops by ${Math.abs(scoreDiff)} points` : "is unchanged"} for returning visitors
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("");
  console.log(clr("bold", clr("cyan", "Clusterflick Lighthouse Cache Test")));
  console.log(
    clr(
      "gray",
      `  ${TARGET_URL}  ·  ${PRESET}  ·  ${RUNS} run${RUNS > 1 ? "s" : ""} per condition`,
    ),
  );
  console.log("");

  const chromePath = getChromePath();

  // Shared Chrome user-data-dir so the warm run sees the cold run's cached assets
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-cache-"));
  console.log(clr("gray", `  Profile dir: ${userDataDir}`));
  console.log("");

  const coldMetrics = [];
  const warmMetrics = [];
  let lastColdResult, lastWarmResult;

  try {
    // Cold runs — lighthouse clears cache before each run (disableStorageReset: false)
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(
        `${clr("bold", `[Cold ${i + 1}/${RUNS}]`)} Running...`,
      );
      const result = await runLighthouse(TARGET_URL, {
        warm: false,
        userDataDir,
        chromePath,
      });
      const m = extractMetrics(result.lhr);
      coldMetrics.push(m);
      lastColdResult = result;
      console.log(
        `  score: ${clr(scoreColor(m.score), m.score)}  LCP: ${fmtMs(m.lcp)}  TBT: ${fmtMs(m.tbt)}  transfer: ${fmtKB(m.transferKB)}`,
      );
    }

    // Warm runs — cache preserved from the last cold run (disableStorageReset: true)
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(
        `${clr("bold", `[Warm ${i + 1}/${RUNS}]`)} Running...`,
      );
      const result = await runLighthouse(TARGET_URL, {
        warm: true,
        userDataDir,
        chromePath,
      });
      const m = extractMetrics(result.lhr);
      warmMetrics.push(m);
      lastWarmResult = result;
      console.log(
        `  score: ${clr(scoreColor(m.score), m.score)}  LCP: ${fmtMs(m.lcp)}  TBT: ${fmtMs(m.tbt)}  transfer: ${fmtKB(m.transferKB)}`,
      );
    }
  } finally {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const cold = coldMetrics.length > 1 ? average(coldMetrics) : coldMetrics[0];
  const warm = warmMetrics.length > 1 ? average(warmMetrics) : warmMetrics[0];

  printDashboard(cold, warm);

  // HTML reports (open in browser for full Lighthouse UI)
  const coldHtmlPath = path.join(OUT_DIR, "cold-cache.html");
  const warmHtmlPath = path.join(OUT_DIR, "warm-cache.html");
  if (lastColdResult?.report?.[0]) {
    fs.writeFileSync(coldHtmlPath, lastColdResult.report[0]);
    console.log(`${clr("green", "✓")} ${coldHtmlPath}`);
  }
  if (lastWarmResult?.report?.[0]) {
    fs.writeFileSync(warmHtmlPath, lastWarmResult.report[0]);
    console.log(`${clr("green", "✓")} ${warmHtmlPath}`);
  }

  // JSON — raw data for further analysis
  const jsonPath = path.join(OUT_DIR, "comparison.json");
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        url: TARGET_URL,
        preset: PRESET,
        runs: RUNS,
        timestamp: new Date().toISOString(),
        cold,
        warm,
        improvement: {
          scorePoints: warm.score - cold.score,
          fcpMs: cold.fcp - warm.fcp,
          lcpMs: cold.lcp - warm.lcp,
          tbtMs: cold.tbt - warm.tbt,
          siMs: cold.si - warm.si,
          ttiMs: cold.tti - warm.tti,
          transferSavedKB: cold.transferKB - warm.transferKB,
          transferSavedPct: cold.transferKB
            ? Math.round(
                ((cold.transferKB - warm.transferKB) / cold.transferKB) * 100,
              )
            : 0,
        },
      },
      null,
      2,
    ),
  );
  console.log(`${clr("green", "✓")} ${jsonPath}`);

  // Markdown — blog post ready summary
  const mdPath = path.join(OUT_DIR, "blog-summary.md");
  fs.writeFileSync(mdPath, generateBlogSummary(cold, warm));
  console.log(`${clr("green", "✓")} ${mdPath}`);

  console.log("");
}

main().catch((err) => {
  console.error(clr("red", "\nError:"), err.message);
  if (err.message.includes("Cannot find module")) {
    console.error(clr("yellow", "\nInstall missing dependencies:"));
    console.error("  npm install --save-dev lighthouse chrome-launcher");
  }
  process.exit(1);
});
