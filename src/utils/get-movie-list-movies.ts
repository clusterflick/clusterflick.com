import {
  FilterId,
  type FilterState,
  type MoviesRecord,
} from "@/lib/filters/types";
import { apply, getPermissiveState } from "@/lib/filters/manager";
import { createMovieMatcher } from "@/utils/match-movie";
import { MOVIE_LISTS, type MovieList } from "@/data/movie-lists";
import type { Movie } from "@/types";

/** A film on a list, alongside what it scored and how often it's showing. */
export type MovieListFilm = {
  movie: Movie;
  performanceCount: number;
  /** Published position, for curated lists that are ranked. */
  rank?: number;
};

/** A list a given film belongs to, for the "Appears on" pills on its movie page. */
export type MovieListMembership = {
  id: string;
  /** Short label for the pill, e.g. "RT 300 Best". */
  badgeLabel: string;
  sourceName: string;
  /** The film's published position, on ranked lists only. */
  rank?: number;
};

type MovieListIndex = {
  byList: Map<string, MovieListFilm[]>;
  byMovie: Map<string, MovieListMembership[]>;
};

/**
 * Build the two-way index from scratch. Takes the lists to index so tests can
 * drive it with fixtures; callers should use `getMovieListIndex`, which caches
 * and always uses the registry.
 */
export function buildMovieListIndex(
  movies: MoviesRecord,
  lists: MovieList[] = MOVIE_LISTS,
): MovieListIndex {
  // Only films you can still go and see, with finished performances pruned —
  // the same rule the festival and film club pages use.
  const state: FilterState = {
    ...getPermissiveState(),
    [FilterId.HideFinished]: true,
  };
  const showing = Object.values(apply(movies, state));
  const match = createMovieMatcher(showing);

  const byList = new Map<string, MovieListFilm[]>();
  const byMovie = new Map<string, MovieListMembership[]>();

  for (const list of lists) {
    const films: MovieListFilm[] = [];

    if (list.kind === "curated") {
      const seen = new Set<string>();
      // Entries are stored in published order, so pushing in order keeps the
      // countdown intact without a further sort.
      for (const entry of list.entries) {
        const movie = match(entry, list.yearTolerance);
        if (!movie || seen.has(movie.id)) continue;
        seen.add(movie.id);
        films.push({
          movie,
          performanceCount: movie.performances.length,
          rank: entry.rank,
        });
      }
    } else {
      const scored: { film: MovieListFilm; score: number }[] = [];
      for (const movie of showing) {
        const score = list.score(movie);
        if (score === null) continue;
        scored.push({
          film: { movie, performanceCount: movie.performances.length },
          score,
        });
      }
      scored.sort(
        (a, b) =>
          b.score - a.score ||
          b.film.performanceCount - a.film.performanceCount ||
          a.film.movie.title.localeCompare(b.film.movie.title),
      );
      films.push(...scored.map(({ film }) => film));
    }

    byList.set(list.id, films);

    for (const film of films) {
      const memberships = byMovie.get(film.movie.id) ?? [];
      memberships.push({
        id: list.id,
        badgeLabel: list.badgeLabel,
        sourceName: list.sourceName,
        rank: film.rank,
      });
      byMovie.set(film.movie.id, memberships);
    }
  }

  return { byList, byMovie };
}

// Every movie page needs the reverse lookup, and there are thousands of them —
// so the index is built once per dataset rather than once per page.
const indexCache = new WeakMap<MoviesRecord, MovieListIndex>();

export function getMovieListIndex(movies: MoviesRecord): MovieListIndex {
  const cached = indexCache.get(movies);
  if (cached) return cached;

  const index = buildMovieListIndex(movies);
  indexCache.set(movies, index);
  return index;
}

/** The list's films that are currently showing, in the list's own order. */
export function getMovieListFilms(
  list: MovieList,
  movies: MoviesRecord,
): MovieListFilm[] {
  return getMovieListIndex(movies).byList.get(list.id) ?? [];
}

/** The lists a given film appears on, for the badges on its movie page. */
export function getMovieListsForMovie(
  movieId: string,
  movies: MoviesRecord,
): MovieListMembership[] {
  return getMovieListIndex(movies).byMovie.get(movieId) ?? [];
}
