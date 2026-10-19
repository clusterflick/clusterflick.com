/* eslint-disable */
const { existsSync, mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const data = require("../combined-data/combined-data.json");
// Optional review sources: default to {} when the data file isn't present yet
// so the site can still be built and deployed without them.
const optionalReviews = (file) => {
  try {
    return require(file);
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
    console.warn(`Optional review data not found, skipping: ${file}`);
    return {};
  }
};
const bechdelResults = optionalReviews("../matched-data/bechdel.json");
const imdbReviews = optionalReviews("../matched-data/imdb.json");
const letterboxdReviews = optionalReviews("../matched-data/letterboxd.json");
const metacriticReviews = optionalReviews("../matched-data/metacritic.json");
const moviedbReviews = optionalReviews("../matched-data/moviedb.json");
const rottentomatoesReviews = optionalReviews(
  "../matched-data/rottentomatoes.json",
);
// Keyed by venue id, and holding only the venues that have ever had a
// screening — a venue missing from it has never had one, which is not the same
// as having gone quiet.
const { venues: venueRegistry = {} } = optionalReviews(
  "../diffed-data/venue-registry.json",
);

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

function addReviewData(data) {
  Object.values(data.movies).forEach((movie) => {
    movie.bechdel = bechdelResults[movie.id];
    movie.imdb = imdbReviews[movie.id];
    movie.letterboxd = letterboxdReviews[movie.id];
    movie.metacritic = metacriticReviews[movie.id];
    movie.moviedb = moviedbReviews[movie.id];
    movie.rottenTomatoes = rottentomatoesReviews[movie.id];
  });
  return data;
}

// Must run after addReviewData, or there is nothing to trim
function trimRottenTomatoData(data) {
  Object.values(data.movies).forEach((movie) => {
    if (movie.rottenTomatoes) {
      delete movie.rottenTomatoes.audience?.verified;
      delete movie.rottenTomatoes.audience?.all?.dislikes;
      delete movie.rottenTomatoes.audience?.all?.likes;
      delete movie.rottenTomatoes.critics?.top;
      delete movie.rottenTomatoes.critics?.all?.dislikes;
      delete movie.rottenTomatoes.critics?.all?.likes;
    }
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

/**
 * Replace each person's raw TheMovieDB popularity with a 0-99 percentile rank.
 *
 * Only the ordering matters — it breaks ties between two people a search could
 * equally have named — so the rank costs 91KB where the raw float costs 274KB
 * in a blob every visitor downloads. A percentile rather than a rounded score
 * because popularity is skewed enough that rounding puts almost everyone at 0.
 *
 * Someone TheMovieDB has no score for gets no rank: unranked, not unpopular.
 */
function rankPeoplePopularity(data) {
  const scored = Object.values(data.people).filter(
    (person) => typeof person.popularity === "number",
  );
  const ordered = [...scored].sort((a, b) => a.popularity - b.popularity);

  ordered.forEach((person, index) => {
    person.p = Math.floor((index / ordered.length) * 100);
  });
  Object.values(data.people).forEach((person) => delete person.popularity);

  return data;
}

function removeIdProperty(data) {
  Object.keys(data.genres).forEach((id) => {
    if (data.genres[id].id === id) delete data.genres[id].id;
  });
  Object.keys(data.collections).forEach((id) => {
    if (data.collections[id].id === id) delete data.collections[id].id;
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

/**
 * Stamp each venue with the last screening the registry has ever seen there.
 *
 * For a venue with something on this is its furthest-out listing rather than a
 * past date, so consumers have to check the date has passed before reading it
 * as "when this venue went quiet".
 */
function addVenueLastPerformance(data) {
  Object.entries(data.venues).forEach(([id, venue]) => {
    venue.lastPerformance = venueRegistry[id]?.lastPerformance;
  });
  return data;
}

function removeOptionalData(data) {
  return [
    removeShowingOverviews,
    addReviewData,
    trimRottenTomatoData,
    removeOffAccessiblityIndicators,
    rankPeoplePopularity,
    removeIdProperty,
  ].reduce((reducedData, reduction) => reduction(reducedData), data);
}

try {
  const reducedData = removeOptionalData(addVenueLastPerformance(data));
  const { generatedAt, genres, people, venues, collections, movies } =
    reducedData;

  const files = {};
  const mapping = {};
  let bucket = 0;
  let bytesInBucket = 0;
  const TARGET_BYTES_PER_BUCKET = 400_000;

  Object.entries(movies)
    .sort(([, a], [, b]) => a.normalizedTitle.localeCompare(b.normalizedTitle))
    .forEach(([id, movie]) => {
      const movieBytes = Buffer.byteLength(JSON.stringify(movie), "utf8");

      if (
        bytesInBucket > 0 &&
        bytesInBucket + movieBytes > TARGET_BYTES_PER_BUCKET
      ) {
        bucket++;
        bytesInBucket = 0;
      }

      files[bucket] = files[bucket] || {};
      files[bucket][id] = movie;
      mapping[bucket] = mapping[bucket] || [];
      mapping[bucket].push(id);

      bytesInBucket += movieBytes;
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

  // Every visitor downloads the meta blob, so it only carries what a collection
  // needs to be *named* — the pill on a movie page and the homepage row. The
  // membership (parts, overview, backdrop) is an order of magnitude larger and
  // is only ever read at build time, so it goes to its own file.
  const collectionRegistry = {};
  Object.entries(collections).forEach(([id, collection]) => {
    collectionRegistry[id] = {
      name: collection.name,
      slug: collection.slug,
      posterPath: collection.posterPath,
      partCount: collection.parts.length,
    };
  });

  writeFileSync(
    path.join(outputPath, "collections.json"),
    JSON.stringify(collections),
  );

  const meta = {
    generatedAt,
    genres,
    people,
    venues,
    collections: collectionRegistry,
    mapping,
    filenames,
  };
  const metaSerialised = JSON.stringify(meta);
  const outputFilename = `data.meta.${getHash(metaSerialised)}.json`;
  writeFileSync(path.join(outputPath, outputFilename), metaSerialised);
} catch (e) {
  throw e;
}
