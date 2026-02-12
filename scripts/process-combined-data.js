/* eslint-disable */
const { existsSync, mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const data = require("../combined-data/combined-data.json");
const imdbReviews = require("../matched-data/imdb.json");
const letterboxdReviews = require("../matched-data/letterboxd.json");
const metacriticReviews = require("../matched-data/metacritic.json");
const rottentomatoesReviews = require("../matched-data/rottentomatoes.json");

const simplifySorting = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/^the /i, "")
    .normalize("NFD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim();

function getHash(inputString) {
  const hash = crypto.createHash("sha256");
  hash.update(inputString);
  return hash.digest("hex").slice(0, 10);
}
const classifications = ["U", "PG", "12", "12A", "15", "18"];
function removeShowingOverviews(data) {
  Object.values(data.movies).forEach((movie) => {
    const showings = Object.values(movie.showings);

    // Derrive classification if required
    if (!movie.classification) {
      const showingClassifications = showings.reduce(
        (collection, { overview: { classification } }) =>
          classification && classifications.includes(classification)
            ? collection.add(classification)
            : collection,
        new Set(),
      );

      // Showings must agree on the same classification
      if (showingClassifications.size === 1) {
        movie.classification = [...showingClassifications][0].toUpperCase();
      }
    }

    // Get duration if required
    if (!movie.duration) {
      const showingWithDuration = showings.find(({ duration }) => !!duration);
      if (showingWithDuration) movie.duration = showingWithDuration.duration;
    }

    // Delete overview
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

/**
 * Generate URL prefixes automatically based on the data.
 * Finds common prefixes that provide net byte savings when replaced with {index} placeholders.
 */
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

  Object.values(imdbReviews).forEach((review) => {
    if (review?.url) urls.push(review.url);
  });
  Object.values(letterboxdReviews).forEach((review) => {
    if (review?.url) urls.push(review.url);
  });
  Object.values(metacriticReviews).forEach((review) => {
    if (review?.url) urls.push(review.url);
  });
  Object.values(rottentomatoesReviews).forEach((review) => {
    if (review?.url) urls.push(review.url);
  });

  // Find candidate prefixes at natural URL boundaries
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

  // Calculate net savings for each prefix
  // Savings = (prefix_length - placeholder_length) × usage_count - prefix_length_in_meta
  const prefixesWithSavings = [];

  prefixCounts.forEach((count, prefix) => {
    if (count < 2) return; // Must be used at least twice to be worthwhile

    // Placeholder length varies: {0}-{9} = 3 chars, {10}-{99} = 4 chars, etc.
    // Use conservative estimate of 4 chars
    const placeholderLength = 4;
    const savingsPerUse = prefix.length - placeholderLength;
    const storageCost = prefix.length;
    const netSavings = savingsPerUse * count - storageCost;

    if (netSavings > 0) {
      prefixesWithSavings.push({ prefix, count, savings: netSavings });
    }
  });

  // Sort by savings (descending)
  prefixesWithSavings.sort((a, b) => b.savings - a.savings);

  // Greedily select prefixes, preferring longer ones when they subsume shorter ones
  const selectedPrefixes = [];

  prefixesWithSavings.forEach(({ prefix }) => {
    // Check if this prefix would be redundant
    // A shorter prefix that's already selected would match all URLs this one matches
    const subsumedByExisting = selectedPrefixes.some(
      (selected) => prefix.startsWith(selected) && prefix !== selected,
    );

    if (subsumedByExisting) return;

    // Check if this prefix would subsume an existing one with less savings
    // If so, the existing shorter one is already covering those URLs
    const wouldSubsumeExisting = selectedPrefixes.some(
      (selected) => selected.startsWith(prefix) && selected !== prefix,
    );

    if (wouldSubsumeExisting) return;

    selectedPrefixes.push(prefix);
  });

  // Sort alphabetically for consistent output
  return selectedPrefixes.sort();
}

function extractCommonUrlPrefix(data) {
  // Generate prefixes dynamically based on actual data
  const urlPrefixes = generateUrlPrefixes(data);
  data.urlPrefixes = urlPrefixes;

  Object.values(data.movies).forEach((movie) => {
    // Add reviews to movie data
    movie.imdb = imdbReviews[movie.id];
    movie.letterboxd = letterboxdReviews[movie.id];
    movie.metacritic = metacriticReviews[movie.id];
    movie.rottenTomatoes = rottentomatoesReviews[movie.id];

    if (movie.rottenTomatoes) {
      urlPrefixes.forEach((prefix, index) => {
        movie.rottenTomatoes.url = movie.rottenTomatoes.url.replace(
          prefix,
          `{${index}}`,
        );
      });
    }

    const showings = Object.values(movie.showings);
    showings.forEach((showing) => {
      urlPrefixes.forEach((prefix, index) => {
        showing.url = showing.url.replace(prefix, `{${index}}`);
      });
    });

    const performances = Object.values(movie.performances);
    performances.forEach((performance) => {
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

function removeOffAccessiblityIndicators(data) {
  Object.values(data.movies).forEach((movie) => {
    const performances = Object.values(movie.performances);
    performances.forEach((performance) => {
      if (!performance.accessibility) return;
      const accessibility = Object.keys(performance.accessibility);
      accessibility.forEach((flag) => {
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
    if (movie.id === id) delete data.movies[id].id;

    Object.keys(movie.showings).forEach((showingId) => {
      if (movie.showings[showingId].id === showingId) {
        delete movie.showings[showingId].id;
      }
    });
  });
  return data;
}

function removeOptionalData(data) {
  return [
    removeShowingOverviews,
    trimRottenTomatoData,
    extractCommonUrlPrefix,
    removeOffAccessiblityIndicators,
    removeIdProperty,
  ].reduce((reducedData, reduction) => reduction(reducedData), data);
}

try {
  const reducedData = removeOptionalData(data);
  const { generatedAt, genres, people, venues, urlPrefixes, movies } =
    reducedData;

  const files = {};
  const mapping = {};
  let bucket = 0;
  let countInBucket = 0;
  const MAX_PERFORMANCES_PER_BUCKET = 1000;

  Object.entries(movies)
    .sort(([, a], [, b]) => a.normalizedTitle.localeCompare(b.normalizedTitle))
    .forEach(([id, movie]) => {
      const count = Object.keys(movie.performances).length;

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

  const outputPath = path.join(__dirname, "..", "public", "data");
  const filenames = [];
  Object.keys(files).forEach((id) => {
    const serialised = JSON.stringify(files[id]);
    if (!existsSync(outputPath)) mkdirSync(outputPath, { recursive: true });
    const outputFilename = `data.${id}.${getHash(serialised)}.json`;
    filenames.push(outputFilename);
    writeFileSync(path.join(outputPath, outputFilename), serialised);
  });

  const meta = {
    generatedAt,
    genres,
    people,
    venues,
    urlPrefixes,
    mapping,
    filenames,
  };
  const metaSerialised = JSON.stringify(meta);
  const outputFilename = `data.meta.${getHash(metaSerialised)}.json`;
  writeFileSync(path.join(outputPath, outputFilename), metaSerialised);
} catch (e) {
  throw e;
}
