import {
  FilterId,
  type FilterState,
  type MoviesRecord,
} from "@/lib/filters/types";
import { apply, getPermissiveState } from "@/lib/filters/manager";
import type { FilmClub } from "@/data/film-clubs";

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
  const result: MoviesRecord = {};

  for (const matcher of club.matchers) {
    const state: FilterState = {
      ...getPermissiveState(),
      ...matcher,
      [FilterId.HideFinished]: true,
    };
    const filtered = apply(movies, state);
    for (const [id, movie] of Object.entries(filtered)) {
      result[id] = movie;
    }
  }

  return result;
}
