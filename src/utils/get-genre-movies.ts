import type { Movie } from "@/types";

export type GenreMovie = { movie: Movie; performanceCount: number };

/**
 * Films belonging to a genre that have at least one upcoming performance,
 * with the count of those upcoming performances.
 *
 * Genre membership is movie-level (`movie.genres`), so a matching movie
 * contributes all of its upcoming performances. `nowTs` should be the data's
 * generated-at timestamp so results are stable for a given build.
 */
export function getGenreMovies(
  genreId: string,
  movies: Record<string, Movie>,
  nowTs: number,
): GenreMovie[] {
  const result: GenreMovie[] = [];

  for (const movie of Object.values(movies)) {
    if (!movie.genres?.includes(genreId)) continue;

    let performanceCount = 0;
    for (const performance of movie.performances) {
      if (performance.time >= nowTs) performanceCount++;
    }

    if (performanceCount > 0) {
      result.push({ movie, performanceCount });
    }
  }

  return result;
}
