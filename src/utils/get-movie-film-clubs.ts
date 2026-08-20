import { FILM_CLUBS } from "@/data/film-clubs";
import { getFilmClubMovies } from "@/utils/get-film-club-movies";
import type { MoviesRecord } from "@/lib/filters/types";

export type MovieFilmClub = {
  id: string;
  name: string;
  imagePath: string | null;
  movieCount: number;
  performanceCount: number;
};

/**
 * Summarises a film club and the movies matched to it, in the shape the film
 * club card renders. Unlike a festival there is no date range: a club runs
 * indefinitely, so the span of its current programme says nothing about it.
 *
 * `getImagePath` is injected by the caller so this module stays free of
 * filesystem imports (the movie page content is a client component).
 */
export function summariseFilmClub(
  club: { id: string; name: string },
  clubMovies: MoviesRecord,
  getImagePath: (filmClubId: string) => string | null = () => null,
): MovieFilmClub {
  const clubMovieList = Object.values(clubMovies);

  return {
    id: club.id,
    name: club.name,
    imagePath: getImagePath(club.id),
    movieCount: clubMovieList.length,
    performanceCount: clubMovieList.reduce(
      (total, movie) => total + movie.performances.length,
      0,
    ),
  };
}

/**
 * Returns the film clubs that a given movie screens with.
 * Checks each registered club's matchers against the full movie set, then looks
 * for the target movie ID in the results.
 */
export function getMovieFilmClubs(
  movieId: string,
  movies: MoviesRecord,
  getImagePath: (filmClubId: string) => string | null = () => null,
): MovieFilmClub[] {
  const result: MovieFilmClub[] = [];

  for (const club of FILM_CLUBS) {
    const clubMovies = getFilmClubMovies(club, movies);
    if (movieId in clubMovies) {
      result.push(summariseFilmClub(club, clubMovies, getImagePath));
    }
  }

  return result;
}
