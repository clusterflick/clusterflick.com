/* eslint-disable */
/**
 * Benchmark script to measure the impact of each data optimisation.
 *
 * For each variant it clones the raw data, applies a subset of the
 * optimisations, chunks, serialises (with/without compress-json),
 * gzips, and reports raw + gzipped totals.
 *
 * Usage:  node scripts/benchmark-optimisations.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { gzipSync } = require("node:zlib");
const { compress, trimUndefinedRecursively } = require("compress-json");

// ---------------------------------------------------------------------------
// Load source data
// ---------------------------------------------------------------------------

const combinedPath = path.join(
  __dirname,
  "..",
  "combined-data",
  "combined-data.json",
);
if (!fs.existsSync(combinedPath)) {
  console.error(
    "Error: combined-data/combined-data.json not found.\n" +
      "Download the data first — this file is fetched from GitHub releases in CI.",
  );
  process.exit(1);
}

const matchedDir = path.join(__dirname, "..", "matched-data");
for (const file of [
  "imdb.json",
  "letterboxd.json",
  "metacritic.json",
  "rottentomatoes.json",
]) {
  if (!fs.existsSync(path.join(matchedDir, file))) {
    console.error(
      `Error: matched-data/${file} not found.\n` +
        "Download the matched data first — these files are fetched from GitHub releases in CI.",
    );
    process.exit(1);
  }
}

// Read raw string so we can clone cheaply via JSON.parse
const rawDataString = fs.readFileSync(combinedPath, "utf-8");
const imdbReviews = require("../matched-data/imdb.json");
const letterboxdReviews = require("../matched-data/letterboxd.json");
const metacriticReviews = require("../matched-data/metacritic.json");
const rottentomatoesReviews = require("../matched-data/rottentomatoes.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_PERFORMANCES_PER_BUCKET = 1000;
const classifications = ["U", "PG", "12", "12A", "15", "18"];

function cloneData() {
  return JSON.parse(rawDataString);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function pct(value, baseline) {
  const diff = ((value - baseline) / baseline) * 100;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Data assembly — always applied (not an optimisation)
// ---------------------------------------------------------------------------

/**
 * Merge review data from matched-data files onto each movie.
 * In the production script this happens inside extractCommonUrlPrefix,
 * but it's data assembly, not an optimisation, so we always run it.
 */
function mergeReviews(data) {
  Object.values(data.movies).forEach((movie) => {
    movie.imdb = imdbReviews[movie.id];
    movie.letterboxd = letterboxdReviews[movie.id];
    movie.metacritic = metacriticReviews[movie.id];
    movie.rottenTomatoes = rottentomatoesReviews[movie.id];
  });
  return data;
}

// ---------------------------------------------------------------------------
// Optimisation functions (copied from process-combined-data.js)
// ---------------------------------------------------------------------------

function removeShowingOverviews(data) {
  Object.values(data.movies).forEach((movie) => {
    const showings = Object.values(movie.showings);

    if (!movie.classification) {
      const showingClassifications = showings.reduce(
        (collection, { overview: { classification } }) =>
          classification && classifications.includes(classification)
            ? collection.add(classification)
            : collection,
        new Set(),
      );
      if (showingClassifications.size === 1) {
        movie.classification = [...showingClassifications][0].toUpperCase();
      }
    }

    if (!movie.duration) {
      const showingWithDuration = showings.find(({ duration }) => !!duration);
      if (showingWithDuration) movie.duration = showingWithDuration.duration;
    }

    showings.forEach((showing) => delete showing.overview);
  });
  return data;
}

function trimRottenTomatoData(data) {
  Object.values(data.movies).forEach((movie) => {
    if (movie.rottenTomatoes) {
      delete movie.rottenTomatoes.audience.verified;
      delete movie.rottenTomatoes.audience.all?.dislikes;
      delete movie.rottenTomatoes.audience.all?.likes;
      delete movie.rottenTomatoes.critics.top;
      delete movie.rottenTomatoes.critics.all?.dislikes;
      delete movie.rottenTomatoes.critics.all?.likes;
    }
  });
  return data;
}

function generateUrlPrefixes(data, minPrefixLength = 20) {
  const urls = [];

  Object.values(data.movies).forEach((movie) => {
    Object.values(movie.showings).forEach((showing) => {
      if (showing.url) urls.push(showing.url);
    });
    movie.performances.forEach((performance) => {
      if (performance.bookingUrl) urls.push(performance.bookingUrl);
    });
  });

  // Also include review URLs (already merged onto movies)
  Object.values(data.movies).forEach((movie) => {
    if (movie.imdb?.url) urls.push(movie.imdb.url);
    if (movie.letterboxd?.url) urls.push(movie.letterboxd.url);
    if (movie.metacritic?.url) urls.push(movie.metacritic.url);
    if (movie.rottenTomatoes?.url) urls.push(movie.rottenTomatoes.url);
  });

  const prefixCounts = new Map();
  urls.forEach((url) => {
    for (let i = 0; i < url.length; i++) {
      if (
        url[i] === "/" ||
        url[i] === "?" ||
        url[i] === "=" ||
        url[i] === "&"
      ) {
        const prefix = url.substring(0, i + 1);
        if (prefix.length >= minPrefixLength) {
          prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
        }
      }
    }
  });

  const prefixesWithSavings = [];
  prefixCounts.forEach((count, prefix) => {
    if (count < 2) return;
    const placeholderLength = 4;
    const savingsPerUse = prefix.length - placeholderLength;
    const storageCost = prefix.length;
    const netSavings = savingsPerUse * count - storageCost;
    if (netSavings > 0) {
      prefixesWithSavings.push({ prefix, count, savings: netSavings });
    }
  });

  prefixesWithSavings.sort((a, b) => b.savings - a.savings);

  const selectedPrefixes = [];
  prefixesWithSavings.forEach(({ prefix }) => {
    const subsumedByExisting = selectedPrefixes.some(
      (selected) => prefix.startsWith(selected) && prefix !== selected,
    );
    if (subsumedByExisting) return;

    const wouldSubsumeExisting = selectedPrefixes.some(
      (selected) => selected.startsWith(prefix) && selected !== prefix,
    );
    if (wouldSubsumeExisting) return;

    selectedPrefixes.push(prefix);
  });

  return selectedPrefixes.sort();
}

function extractUrlPrefixes(data) {
  const urlPrefixes = generateUrlPrefixes(data);
  data.urlPrefixes = urlPrefixes;

  Object.values(data.movies).forEach((movie) => {
    if (movie.rottenTomatoes?.url) {
      urlPrefixes.forEach((prefix, index) => {
        movie.rottenTomatoes.url = movie.rottenTomatoes.url.replace(
          prefix,
          `{${index}}`,
        );
      });
    }

    Object.values(movie.showings).forEach((showing) => {
      urlPrefixes.forEach((prefix, index) => {
        showing.url = showing.url.replace(prefix, `{${index}}`);
      });
    });

    movie.performances.forEach((performance) => {
      urlPrefixes.forEach((prefix, index) => {
        performance.bookingUrl = performance.bookingUrl.replace(
          prefix,
          `{${index}}`,
        );
      });
    });
  });
  return data;
}

function removeOffAccessibilityIndicators(data) {
  Object.values(data.movies).forEach((movie) => {
    movie.performances.forEach((performance) => {
      if (!performance.accessibility) return;
      Object.keys(performance.accessibility).forEach((flag) => {
        if (!performance.accessibility[flag]) {
          delete performance.accessibility[flag];
        }
      });
    });
  });
  return data;
}

function removeIdProperty(data) {
  Object.keys(data.genres).forEach((id) => {
    if (data.genres[id].id === id) delete data.genres[id].id;
  });
  Object.keys(data.venues).forEach((id) => {
    if (data.venues[id].id === id) delete data.venues[id].id;
  });
  Object.keys(data.people).forEach((id) => {
    if (data.people[id].id === id) delete data.people[id].id;
  });
  Object.keys(data.movies).forEach((id) => {
    const movie = data.movies[id];
    if (movie.id === id) delete movie.id;
    Object.keys(movie.showings).forEach((showingId) => {
      if (movie.showings[showingId].id === showingId) {
        delete movie.showings[showingId].id;
      }
    });
  });
  return data;
}

// ---------------------------------------------------------------------------
// Chunking (same logic as production)
// ---------------------------------------------------------------------------

function chunkMovies(data) {
  const { generatedAt, genres, people, venues, movies } = data;
  const urlPrefixes = data.urlPrefixes || [];

  const files = {};
  const mapping = {};
  let bucket = 0;
  let countInBucket = 0;

  Object.entries(movies)
    .sort(([, a], [, b]) => a.normalizedTitle.localeCompare(b.normalizedTitle))
    .forEach(([id, movie]) => {
      const count = movie.performances.length;

      if (
        count > MAX_PERFORMANCES_PER_BUCKET ||
        (countInBucket > 0 &&
          countInBucket + count > MAX_PERFORMANCES_PER_BUCKET)
      ) {
        bucket++;
        countInBucket = 0;
      }

      files[bucket] = files[bucket] || {};
      files[bucket][id] = movie;
      mapping[bucket] = mapping[bucket] || [];
      mapping[bucket].push(id);

      if (count <= MAX_PERFORMANCES_PER_BUCKET) countInBucket += count;
    });

  const filenames = Object.keys(files).map((i) => `data.${i}.json`);
  const meta = {
    generatedAt,
    genres,
    people,
    venues,
    urlPrefixes,
    mapping,
    filenames,
  };

  return { files, meta };
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

function measureVariant(options) {
  const data = cloneData();

  // Always merge reviews (data assembly, not an optimisation)
  mergeReviews(data);

  // Apply optimisations based on flags
  if (!options.skipOverviews) removeShowingOverviews(data);
  if (!options.skipTrimRT) trimRottenTomatoData(data);
  if (!options.skipUrlPrefixes) extractUrlPrefixes(data);
  else data.urlPrefixes = [];
  if (!options.skipAccessibility) removeOffAccessibilityIndicators(data);
  if (!options.skipRemoveIds) removeIdProperty(data);

  // Chunk
  const { files, meta } = chunkMovies(data);

  // Choose serialiser
  const useCompressJson = !options.skipCompressJson;
  const serialize = (obj) => {
    if (useCompressJson) {
      const clone = JSON.parse(JSON.stringify(obj));
      trimUndefinedRecursively(clone);
      return JSON.stringify(compress(clone));
    }
    return JSON.stringify(obj);
  };

  // Measure each chunk file
  let totalRaw = 0;
  let totalGzipped = 0;
  const numChunks = Object.keys(files).length;

  Object.values(files).forEach((file) => {
    const serialised = serialize(file);
    const buf = Buffer.from(serialised, "utf-8");
    const gzipped = gzipSync(buf);
    totalRaw += buf.length;
    totalGzipped += gzipped.length;
  });

  // Measure meta file
  const metaSerialised = serialize(meta);
  const metaBuf = Buffer.from(metaSerialised, "utf-8");
  const metaGzipped = gzipSync(metaBuf);
  const metaRaw = metaBuf.length;
  const metaGz = metaGzipped.length;

  totalRaw += metaRaw;
  totalGzipped += metaGz;

  return {
    totalRaw,
    totalGzipped,
    numFiles: numChunks + 1,
    metaRaw,
    metaGz,
  };
}

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const allOn = {
  skipCompressJson: false,
  skipRemoveIds: false,
  skipAccessibility: false,
  skipUrlPrefixes: false,
  skipTrimRT: false,
  skipOverviews: false,
};

const variants = [
  { name: "All optimisations (baseline)", ...allOn },
  { name: "Without compress-json", ...allOn, skipCompressJson: true },
  { name: "Without removing IDs", ...allOn, skipRemoveIds: true },
  {
    name: "Without removing false a11y flags",
    ...allOn,
    skipAccessibility: true,
  },
  { name: "Without URL prefix extraction", ...allOn, skipUrlPrefixes: true },
  { name: "Without trimming RT data", ...allOn, skipTrimRT: true },
  {
    name: "Without removing showing overviews",
    ...allOn,
    skipOverviews: true,
  },
  {
    name: "No optimisations at all",
    skipCompressJson: true,
    skipRemoveIds: true,
    skipAccessibility: true,
    skipUrlPrefixes: true,
    skipTrimRT: true,
    skipOverviews: true,
  },
];

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log("Benchmarking data pipeline optimisations…\n");

// Measure raw input for reference
const inputSize = Buffer.byteLength(rawDataString, "utf-8");
const inputGzipped = gzipSync(Buffer.from(rawDataString, "utf-8")).length;
console.log(
  `Raw input (combined-data.json): ${formatBytes(inputSize)} raw, ${formatBytes(inputGzipped)} gzipped\n`,
);

const results = [];
for (const variant of variants) {
  process.stdout.write(`  Processing: ${variant.name}…`);
  const start = Date.now();
  const result = measureVariant(variant);
  const elapsed = Date.now() - start;
  results.push({ ...result, name: variant.name, elapsed });
  console.log(` done (${(elapsed / 1000).toFixed(1)}s)`);
}

const baseline = results[0];

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

console.log("\n" + "=".repeat(120));
console.log("RESULTS");
console.log("=".repeat(120));

// Header
const nameWidth = 42;
const colWidth = 16;

console.log(
  [
    "Variant".padEnd(nameWidth),
    "Files".padStart(colWidth),
    "Raw total".padStart(colWidth),
    "Gzipped total".padStart(colWidth),
    "Raw Δ".padStart(colWidth),
    "Gzip Δ".padStart(colWidth),
  ].join(""),
);
console.log("-".repeat(120));

for (const r of results) {
  const rawDelta =
    r === baseline
      ? "—"
      : `${pct(r.totalRaw, baseline.totalRaw)} (${formatBytes(r.totalRaw - baseline.totalRaw)})`;
  const gzDelta =
    r === baseline
      ? "—"
      : `${pct(r.totalGzipped, baseline.totalGzipped)} (${formatBytes(r.totalGzipped - baseline.totalGzipped)})`;

  console.log(
    [
      r.name.padEnd(nameWidth),
      String(r.numFiles).padStart(colWidth),
      formatBytes(r.totalRaw).padStart(colWidth),
      formatBytes(r.totalGzipped).padStart(colWidth),
      rawDelta.padStart(colWidth),
      gzDelta.padStart(colWidth),
    ].join(""),
  );
}

console.log("-".repeat(120));

// Summary: total savings of all optimisations combined
const noOpt = results[results.length - 1];
console.log("\nTotal savings (all optimisations vs none):");
console.log(
  `  Raw:     ${formatBytes(noOpt.totalRaw)} → ${formatBytes(baseline.totalRaw)}  (${pct(baseline.totalRaw, noOpt.totalRaw)}, saved ${formatBytes(noOpt.totalRaw - baseline.totalRaw)})`,
);
console.log(
  `  Gzipped: ${formatBytes(noOpt.totalGzipped)} → ${formatBytes(baseline.totalGzipped)}  (${pct(baseline.totalGzipped, noOpt.totalGzipped)}, saved ${formatBytes(noOpt.totalGzipped - baseline.totalGzipped)})`,
);
console.log();
