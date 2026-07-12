import type { Movie, MoviePerformance } from "@/types";
import type { FormatDefinition } from "@/data/formats";
import { pruneByPerformances } from "@/utils/prune-movies";

export type FormatMovie = { movie: Movie; performanceCount: number };

/**
 * Films with at least one upcoming performance in the given format.
 *
 * Unlike genre membership (which is movie-level), format is recorded per
 * performance, so results are pruned at performance level: each returned movie
 * carries only its upcoming performances in this format (and their showings).
 * A film screening in several formats only contributes the matching ones — the
 * same showing-level pruning semantics used by film clubs.
 *
 * `nowTs` should be the data's generated-at timestamp so results are stable for
 * a given build. Default format values are never matched here — an absent
 * `format.<kind>` means the default, and default formats have no landing page.
 */
export function getFormatMovies(
  format: FormatDefinition,
  movies: Record<string, Movie>,
  nowTs: number,
): FormatMovie[] {
  const matches = (perf: MoviePerformance): boolean =>
    perf.time >= nowTs && perf.format?.[format.kind] === format.id;

  const pruned = pruneByPerformances(movies, matches);

  return Object.values(pruned).map((movie) => ({
    movie,
    performanceCount: movie.performances.length,
  }));
}
