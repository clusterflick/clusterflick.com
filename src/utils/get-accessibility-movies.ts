import type { AccessibilityFeature, Movie, MoviePerformance } from "@/types";
import { pruneByPerformances } from "@/utils/prune-movies";

export type AccessibilityMovie = { movie: Movie; performanceCount: number };

/**
 * Films with at least one upcoming performance carrying the given
 * accessibility feature.
 *
 * Like format, accessibility is recorded per performance, so results are
 * pruned at performance level: each returned movie carries only its upcoming
 * performances with this feature (and their showings) — the same
 * showing-level pruning `getFormatMovies` uses.
 *
 * `nowTs` should be the data's generated-at timestamp so results are stable
 * for a given build.
 */
export function getAccessibilityMovies(
  feature: AccessibilityFeature,
  movies: Record<string, Movie>,
  nowTs: number,
): AccessibilityMovie[] {
  const matches = (perf: MoviePerformance): boolean =>
    perf.time >= nowTs && Boolean(perf.accessibility?.[feature]);

  const pruned = pruneByPerformances(movies, matches);

  return Object.values(pruned).map((movie) => ({
    movie,
    performanceCount: movie.performances.length,
  }));
}
