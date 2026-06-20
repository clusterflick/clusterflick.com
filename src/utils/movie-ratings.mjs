/**
 * Shared rating / acclaim primitives used by BOTH the build-time editorial
 * summary script (scripts/generate-summary.mjs, plain Node) and the in-app
 * discovery helpers (src/utils/get-discovery-movies.ts, TypeScript).
 *
 * Kept as plain ESM with no project imports so it runs under raw Node AND is
 * importable from TypeScript (tsconfig has allowJs + bundler resolution). This
 * is the single source of truth for "what counts as critically acclaimed", so
 * the editorial summary and the Critics' Picks row always agree.
 */

// A rating only counts as acclaimed once it's backed by enough reviews/votes —
// a high score from a handful of reviews (e.g. 90% from 10 RT critics) isn't a
// reliable signal.
export const LETTERBOXD_MIN_REVIEWS = 2000;
export const RT_MIN_REVIEWS = 40; // ~ Rotten Tomatoes' "Certified Fresh" review floor
export const IMDB_MIN_REVIEWS = 10_000;

// A film with more future showings than this is a permanent fixture (e.g. a
// museum IMAX attraction), not a curated screening worth recommending.
export const EVERGREEN_MAX_FUTURE = 30;

/**
 * Best available rating with a human label, normalised to 0–1. Each source
 * requires a minimum review/vote count.
 *
 * @param {{
 *   letterboxd?: { rating?: number | null; reviews?: number };
 *   rottenTomatoes?: { critics?: { all?: { score?: number | null; reviews?: number } } };
 *   imdb?: { rating?: number | null; reviews?: number };
 * }} movie
 * @returns {{ text: string; norm: number } | null}
 */
export function getRating(movie) {
  const lb = movie.letterboxd;
  if (
    lb &&
    typeof lb.rating === "number" &&
    (lb.reviews ?? 0) >= LETTERBOXD_MIN_REVIEWS
  ) {
    return {
      text: `${lb.rating.toFixed(1)}/5 on Letterboxd`,
      norm: lb.rating / 5,
    };
  }
  const rt = movie.rottenTomatoes?.critics?.all;
  if (
    rt &&
    typeof rt.score === "number" &&
    (rt.reviews ?? 0) >= RT_MIN_REVIEWS
  ) {
    return { text: `${rt.score}% on Rotten Tomatoes`, norm: rt.score / 100 };
  }
  const imdb = movie.imdb;
  if (
    imdb &&
    typeof imdb.rating === "number" &&
    (imdb.reviews ?? 0) >= IMDB_MIN_REVIEWS
  ) {
    return {
      text: `${imdb.rating.toFixed(1)}/10 on IMDb`,
      norm: imdb.rating / 10,
    };
  }
  return null;
}

/**
 * Whether a film is a permanent, continuously-running fixture (more than
 * EVERGREEN_MAX_FUTURE future showings) rather than a curated screening.
 *
 * @param {{ performances?: { time: number }[] }} movie
 * @param {number} now
 * @returns {boolean}
 */
export function isEvergreen(movie, now) {
  let future = 0;
  for (const performance of movie.performances ?? []) {
    if (performance.time >= now) future++;
  }
  return future > EVERGREEN_MAX_FUTURE;
}
