/**
 * TheMovieDB, for the scripts run by hand with a TMDB read access token
 * (`TMDB_TOKEN`): the film details migration and the movie lists' TMDB ids.
 * The site itself never calls TMDB; it goes through the search Worker.
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const MAX_ATTEMPTS = 5;
const REQUEST_TIMEOUT_MS = 10_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A TMDB resource as JSON, or null for a 404. Retries a rate limit (after
 * TMDB's Retry-After), a 5xx and a dropped connection; throws once those run
 * out, or on any other answer.
 */
async function fetchTmdbJson(path, token, params = {}) {
  const url = new URL(`${TMDB_BASE}/${path}`);
  url.searchParams.set("language", "en-GB");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
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
      if (response.ok) return await response.json();
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

/**
 * Runs `work` over every item, `concurrency` at a time (TMDB allows around 40
 * requests a second), collecting failures rather than stopping at the first:
 * one log line then tells a single flaky film from an outage.
 */
async function forEachLimited(items, concurrency, work, onProgress) {
  const failed = [];
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      try {
        await work(item);
      } catch (error) {
        failed.push({ item, error: error.message });
      }
      done++;
      onProgress?.(done, items.length);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return failed;
}

module.exports = { checkTmdbToken, fetchTmdbJson, forEachLimited };
