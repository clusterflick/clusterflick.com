import { FESTIVALS } from "@/data/festivals";
import {
  getFestivalMovies,
  getFestivalDateRange,
} from "@/utils/get-festival-movies";
import type { MoviesRecord } from "@/lib/filters/types";

export type MovieFestival = {
  id: string;
  name: string;
  imagePath: string | null;
  movieCount: number;
  performanceCount: number;
  dateFrom: number | null;
  dateTo: number | null;
};

/**
 * Summarises a festival and the movies matched to it, in the shape the festival
 * card renders. Shared with the venue page, which asks a different question
 * ("which festivals run here?") but shows the same card.
 *
 * `getImagePath` is injected by the caller so this module stays free of
 * filesystem imports (the movie page content is a client component).
 */
export function summariseFestival(
  festival: { id: string; name: string },
  festivalMovies: MoviesRecord,
  getImagePath: (festivalId: string) => string | null = () => null,
): MovieFestival {
  const festivalMovieList = Object.values(festivalMovies);
  const { dateFrom, dateTo } = getFestivalDateRange(festivalMovies);

  return {
    id: festival.id,
    name: festival.name,
    imagePath: getImagePath(festival.id),
    movieCount: festivalMovieList.length,
    performanceCount: festivalMovieList.reduce(
      (total, movie) => total + movie.performances.length,
      0,
    ),
    dateFrom,
    dateTo,
  };
}

/**
 * Returns the festivals that a given movie is part of.
 * Checks each registered festival's matchers against the full movie set,
 * then looks for the target movie ID in the results.
 */
export function getMovieFestivals(
  movieId: string,
  movies: MoviesRecord,
  getImagePath: (festivalId: string) => string | null = () => null,
): MovieFestival[] {
  const result: MovieFestival[] = [];

  for (const festival of FESTIVALS) {
    const festivalMovies = getFestivalMovies(festival, movies);
    if (movieId in festivalMovies) {
      result.push(summariseFestival(festival, festivalMovies, getImagePath));
    }
  }

  return result;
}
