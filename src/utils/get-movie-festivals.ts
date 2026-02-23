import { FESTIVALS } from "@/data/festivals";
import { getFestivalMovies } from "@/utils/get-festival-movies";
import type { MoviesRecord } from "@/lib/filters/types";

export type MovieFestival = {
  id: string;
  name: string;
};

/**
 * Returns the festivals that a given movie is part of.
 * Checks each registered festival's matchers against the full movie set,
 * then looks for the target movie ID in the results.
 */
export function getMovieFestivals(
  movieId: string,
  movies: MoviesRecord,
): MovieFestival[] {
  const result: MovieFestival[] = [];

  for (const festival of FESTIVALS) {
    const festivalMovies = getFestivalMovies(festival, movies);
    if (movieId in festivalMovies) {
      result.push({ id: festival.id, name: festival.name });
    }
  }

  return result;
}
