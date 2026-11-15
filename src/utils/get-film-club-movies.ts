import type { MoviesRecord } from "@clusterflick/catalogue/filters/types";
import { applyMatchers } from "@clusterflick/catalogue/filters/apply-matchers";
import type { FilmClub } from "@clusterflick/catalogue/data/film-clubs";

/**
 * Returns the film club's currently-showing movies — those with at least one
 * upcoming performance. Matchers are OR'd together (union of results), and
 * finished performances are pruned so pages only surface what you can still go
 * and see.
 */
export function getFilmClubMovies(
  club: FilmClub,
  movies: MoviesRecord,
): MoviesRecord {
  return applyMatchers(club.matchers, movies);
}
