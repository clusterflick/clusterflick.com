/**
 * Purges a reader's cached public profile, for a script that changes what it
 * shows as the service account. The site's own writes purge through
 * `commitUserWrite` with the reader's ID token; a script has none, so it sends
 * the profiles Worker's `PURGE_SECRET` and names the reader by uid. See
 * "Caching" in clusterflick/api-profiles' README.
 *
 * Needs, in the environment or .env, when the script writes:
 *   PROFILES_PURGE_SECRET  the Worker's PURGE_SECRET
 *   PROFILES_PURGE_URL     optional; defaults to the live site, and
 *                          http://localhost:8788/api/profiles/purge reaches
 *                          `wrangler dev`
 */
const DEFAULT_PURGE_URL = "https://clusterflick.com/api/profiles/purge";

/**
 * The purge's settings from the environment. Read before anything is written,
 * so a missing secret stops the script rather than leaving a profile cached.
 */
function getPurgeConfig(env = process.env) {
  const secret = env.PROFILES_PURGE_SECRET;
  if (!secret) {
    throw new Error(
      "PROFILES_PURGE_SECRET is not set; see scripts/lib/purge-profile.js",
    );
  }
  return { secret, url: env.PROFILES_PURGE_URL || DEFAULT_PURGE_URL };
}

/** Drops every cached copy of the reader's profile. Throws if it can't. */
async function purgeProfile(uid, { secret, url }, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid }),
  });
  if (!response.ok) {
    throw new Error(
      `Couldn't purge ${uid}'s cached profile: ${response.status} ${await response.text()}`,
    );
  }
}

module.exports = { DEFAULT_PURGE_URL, getPurgeConfig, purgeProfile };
