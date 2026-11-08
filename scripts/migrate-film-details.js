/* eslint-disable */
/**
 * One-off migration: gives every film on every reader's lists its details
 * (genres, directors, top-billed cast, runtime, language) in
 * `users/{uid}/meta/films`, the level every film added since the details
 * shipped already has. See "Film details" under Personalisation in CLAUDE.md.
 *
 *   npm run migrate-film-details            # dry run: reports, writes nothing
 *   npm run migrate-film-details -- --write # writes
 *
 * Needs, in the environment or .env:
 *   GOOGLE_APPLICATION_CREDENTIALS  path to a service-account key JSON
 *                                   (Firebase console → Project settings →
 *                                   Service accounts → Generate new private key)
 *   TMDB_TOKEN                      a TMDB API read access token
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID the project, as for the site
 *
 * The key can read and write every reader's data: keep it out of the
 * repository, and delete it in the console once the migration is done.
 *
 * How it runs:
 *
 * 1. Reads every user's lists and dedupes the films across them, so a film on
 *    fifty lists is looked up once. Only TMDB ids are looked up; an unmatched
 *    film has no TMDB record and is left without details, as the site leaves
 *    it.
 * 2. Looks each up on TMDB directly, a few at a time. TMDB's own answer is
 *    used for every film, including those still showing, so everything is at
 *    one level. A 404 means TMDB has no such film. Anything else that still
 *    fails after retries stops the run before a single write, so nothing is
 *    left half done.
 * 3. Rewrites each user's details document in a transaction, re-reading their
 *    lists inside it, so a film added meanwhile — which the site saves with
 *    its details — keeps them, and one removed meanwhile drops out. The
 *    document is replaced rather than merged, which also clears the details a
 *    removal leaves behind. A user whose document wouldn't change isn't
 *    written.
 *
 * Safe to run again: a second run finds every film already at the level and
 * writes nothing, beyond what TMDB has changed since.
 */
const {
  isTmdbId,
  getListedIds,
  trimTmdbMovie,
  buildDetailsDocument,
  isSameDocument,
} = require("./lib/film-details-migration");

const TMDB_BASE = "https://api.themoviedb.org/3";
/** Lookups in flight at once: TMDB allows around 40 requests a second. */
const CONCURRENCY = 8;
const MAX_ATTEMPTS = 5;
const REQUEST_TIMEOUT_MS = 10_000;
/** Users read from Firestore per page. */
const PAGE_SIZE = 200;
/** A Firestore document's limit is 1 MiB; warn well short of it. */
const SIZE_WARNING_BYTES = 800 * 1024;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadEnv() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // No .env: the environment has to carry it all.
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set; see the top of this script`);
  return value;
}

/**
 * One film from TMDB, or null if it has no such film. Retries a rate limit
 * (after TMDB's Retry-After), a 5xx and a dropped connection; throws once
 * those run out, or on any other answer.
 */
async function fetchTmdbMovie(id, token) {
  const url = `${TMDB_BASE}/movie/${id}?language=en-GB&append_to_response=credits`;
  for (let attempt = 1; ; attempt++) {
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 404) return null;
      if (response.ok) return trimTmdbMovie(await response.json());
      if (response.status !== 429 && response.status < 500) {
        throw Object.assign(new Error(`TMDB responded ${response.status}`), {
          permanent: true,
        });
      }
    } catch (error) {
      if (error.permanent || attempt >= MAX_ATTEMPTS) throw error;
    }
    if (response && attempt >= MAX_ATTEMPTS) {
      throw new Error(
        `TMDB responded ${response.status} after ${attempt} tries`,
      );
    }
    const retryAfter = Number(response?.headers.get("Retry-After"));
    await sleep(
      retryAfter > 0
        ? retryAfter * 1000
        : 1000 * 2 ** (attempt - 1) + Math.random() * 500,
    );
  }
}

/**
 * Checks the token once before anything else, so a bad one stops the run
 * with a reason instead of failing every lookup. TMDB's v3 API key is the
 * likely mix-up: it is 32 hex characters, and isn't accepted as a Bearer
 * token.
 */
async function checkTmdbToken(token) {
  const hint =
    "TMDB_TOKEN must be the API Read Access Token (a long token starting " +
    '"eyJ") from themoviedb.org/settings/api, not the API Key.';
  if (/^[0-9a-f]{32}$/i.test(token)) {
    throw new Error(`TMDB_TOKEN looks like an API Key. ${hint}`);
  }
  const response = await fetch(`${TMDB_BASE}/authentication`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (response.status === 401) {
    throw new Error(`TMDB rejected TMDB_TOKEN. ${hint}`);
  }
  if (!response.ok) {
    throw new Error(`TMDB responded ${response.status} to the token check`);
  }
}

/** Every film's details, by id; collects failures rather than stopping. */
async function fetchAll(ids, token) {
  const fetched = new Map();
  const failed = [];
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < ids.length) {
      const id = ids[next++];
      try {
        fetched.set(id, await fetchTmdbMovie(id, token));
      } catch (error) {
        failed.push({ id, error: error.message });
      }
      done++;
      if (done % 100 === 0 || done === ids.length) {
        console.log(`  ${done} of ${ids.length} looked up`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { fetched, failed };
}

/** Every user's id and listed films, a page at a time. */
async function readAllUsers(db, FieldPath) {
  const users = [];
  let last;
  for (;;) {
    let query = db
      .collection("users")
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (last) query = query.startAfter(last);
    const page = await query.get();
    for (const doc of page.docs) {
      users.push({ uid: doc.id, listed: getListedIds(doc.data()) });
    }
    if (page.size < PAGE_SIZE) return users;
    last = page.docs[page.docs.length - 1];
  }
}

async function main() {
  loadEnv();
  const write = process.argv.includes("--write");
  const token = requireEnv("TMDB_TOKEN");
  requireEnv("GOOGLE_APPLICATION_CREDENTIALS");
  const projectId = requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  await checkTmdbToken(token);

  const { initializeApp, applicationDefault } = require("firebase-admin/app");
  const { getFirestore, FieldPath } = require("firebase-admin/firestore");
  initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore();

  console.log(`${write ? "Migrating" : "Dry run on"} ${projectId}`);
  const users = await readAllUsers(db, FieldPath);
  const allIds = new Set(users.flatMap(({ listed }) => [...listed]));
  const tmdbIds = [...allIds].filter(isTmdbId).sort();
  console.log(
    `${users.length} users, ${allIds.size} distinct films listed, ` +
      `${tmdbIds.length} with TMDB ids, ${allIds.size - tmdbIds.length} unmatched`,
  );

  console.log("Looking up films on TMDB…");
  const { fetched, failed } = await fetchAll(tmdbIds, token);
  if (failed.length > 0) {
    for (const { id, error } of failed) console.error(`  ${id}: ${error}`);
    throw new Error(
      `${failed.length} films couldn't be looked up; nothing has been written. Run again.`,
    );
  }
  const notOnTmdb = tmdbIds.filter((id) => fetched.get(id) === null);
  if (notOnTmdb.length > 0) {
    console.log(
      `TMDB has no record of ${notOnTmdb.length}: ${notOnTmdb.join(", ")}`,
    );
  }

  let changed = 0;
  for (const { uid } of users) {
    const userRef = db.collection("users").doc(uid);
    const detailsRef = userRef.collection("meta").doc("films");
    // A transaction, so lists changed since they were read above are read
    // again and a film added meanwhile keeps the details it was saved with.
    const result = await db.runTransaction(async (transaction) => {
      const [userDoc, detailsDoc] = await transaction.getAll(
        userRef,
        detailsRef,
      );
      const stored = detailsDoc.data() ?? { films: {}, people: {} };
      const { document, withoutDetails } = buildDetailsDocument(
        getListedIds(userDoc.data()),
        fetched,
        stored,
      );
      // A user with nothing listed and no document gets none written.
      const unchanged = isSameDocument(document, stored);
      if (write && !unchanged) transaction.set(detailsRef, document);
      return { document, withoutDetails, unchanged };
    });

    const bytes = Buffer.byteLength(JSON.stringify(result.document));
    const films = Object.keys(result.document.films).length;
    console.log(
      `${uid}: ${films} films with details, ${result.withoutDetails.length} without, ` +
        `${Math.round(bytes / 1024)}KB${result.unchanged ? ", unchanged" : ""}`,
    );
    if (bytes > SIZE_WARNING_BYTES) {
      console.warn(`  ${uid}'s details are nearing Firestore's 1 MiB limit`);
    }
    if (!result.unchanged) changed++;
  }

  console.log(
    write
      ? `Done: ${changed} of ${users.length} users written.`
      : `Dry run: ${changed} of ${users.length} users would be written. Run with --write to apply.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
