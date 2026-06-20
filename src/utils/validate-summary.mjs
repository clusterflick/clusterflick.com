/**
 * Grounding checks for the AI editorial summary (scripts/generate-summary.mjs).
 *
 * Gemini occasionally invents a plausible-but-fake screening (e.g. naming a film
 * that isn't actually playing). The model is asked to return the exact list of
 * films it named; these helpers verify that list against the candidate films we
 * actually gave it, so an invented title is rejected before it reaches the site.
 *
 * Plain ESM with no project imports (same as movie-ratings.mjs) so it runs under
 * raw Node in the build script AND is unit-testable from TypeScript.
 */

/**
 * The set of film titles the model was allowed to name, lowercased. These are
 * the candidate entities from `signals.links` that resolve to a movie (venue
 * links are ignored — only films are validated).
 *
 * @param {{ phrase: string; movieId?: string; venueId?: string }[] | null | undefined} links
 * @returns {Set<string>}
 */
export function getAllowedFilmTitles(links) {
  const titles = new Set();
  for (const link of links ?? []) {
    if (link.movieId && link.phrase) {
      titles.add(link.phrase.trim().toLowerCase());
    }
  }
  return titles;
}

/**
 * Returns the films the model claims it mentioned that are NOT in the allowed
 * set — i.e. hallucinated titles. An empty array means the summary is grounded.
 * Matching is case- and whitespace-insensitive.
 *
 * @param {string[]} filmsMentioned
 * @param {Set<string>} allowedTitles
 * @returns {string[]}
 */
export function findUnknownFilms(filmsMentioned, allowedTitles) {
  const unknown = [];
  for (const title of filmsMentioned ?? []) {
    if (typeof title !== "string") continue;
    const key = title.trim().toLowerCase();
    if (key && !allowedTitles.has(key)) unknown.push(title);
  }
  return unknown;
}

/** Lowercased word tokens of a name, punctuation stripped. */
function nameTokens(name) {
  return name.toLowerCase().replace(/[.,]/g, "").split(/\s+/).filter(Boolean);
}

/**
 * Returns the directors the model claims it credited that don't match any
 * director we actually supplied — i.e. fabricated names. Matching is by word
 * tokens so an editorial surname ("Kubrick") still matches the supplied full
 * name ("Stanley Kubrick"): a mention is valid when all its words appear in some
 * allowed director's name. Guards against wholesale invention, not surname
 * disambiguation.
 *
 * @param {string[] | null | undefined} directorsMentioned
 * @param {string[] | null | undefined} allowedDirectors  full names as supplied
 * @returns {string[]}
 */
export function findUnknownDirectors(directorsMentioned, allowedDirectors) {
  const allowedTokenSets = (allowedDirectors ?? []).map(
    (name) => new Set(nameTokens(name)),
  );
  const unknown = [];
  for (const name of directorsMentioned ?? []) {
    if (typeof name !== "string") continue;
    const tokens = nameTokens(name);
    if (tokens.length === 0) continue;
    const matches = allowedTokenSets.some((set) =>
      tokens.every((token) => set.has(token)),
    );
    if (!matches) unknown.push(name);
  }
  return unknown;
}
