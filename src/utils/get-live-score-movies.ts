import type { Movie } from "@clusterflick/catalogue/types";
import { pruneByPerformances } from "@clusterflick/catalogue/utils/prune-movies";

export type LiveScoreMovie = { movie: Movie; performanceCount: number };

/** Where the page lives; also what the sitemap and llms.txt link to. */
export const LIVE_SCORE_URL = "/live-score";

/**
 * Query string (no leading `?`) for the catalogue's occasions filter at live
 * scores. `base=all`, as on the format pages, so only the occasion constrains
 * it: live-score nights are announced months ahead.
 */
export const LIVE_SCORE_FILTER_PARAMS = "base=all&occasions=liveScore";

/**
 * Films with an upcoming performance with live music: a silent with a pianist
 * or band, or a film "in concert" with an orchestra. Which performances those
 * are is the pipeline's call (`performance.occasions.liveScore`); this only
 * reads it, pruned at performance level as `getFormatMovies` is, so each film
 * carries only its live-score performances.
 *
 * `nowTs` should be the data's `generatedAt`, so a build is stable.
 */
export function getLiveScoreMovies(
  movies: Record<string, Movie>,
  nowTs: number,
): LiveScoreMovie[] {
  const pruned = pruneByPerformances(
    movies,
    (perf) => perf.time >= nowTs && Boolean(perf.occasions?.liveScore),
  );

  return Object.values(pruned).map((movie) => ({
    movie,
    performanceCount: movie.performances.length,
  }));
}
