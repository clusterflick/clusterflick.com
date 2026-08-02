import {
  FilterId,
  type FilterState,
  type MoviesRecord,
} from "@/lib/filters/types";
import { apply, getPermissiveState } from "@/lib/filters/manager";
import { getSearchVariants } from "@/lib/filters/normalize";
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
 * A published list's year can differ from the dataset's by one — festival vs
 * general release, or US vs UK dates — so title matches allow a year either
 * side. Award lists override this via `yearTolerance`, as they cite the award
 * year rather than the film's.
 */
const DEFAULT_YEAR_TOLERANCE = 1;

/**
 * The `rottentomatoes.com/m/<slug>` slug for a movie, or null.
 *
 * Handles both the compressed form the dataset ships (`{102}the_godfather`,
 * where `{102}` indexes `urlPrefixes`) and a fully hydrated URL, so callers
 * don't need to hydrate first.
 */
function getRtSlug(movie: Movie): string | null {
  const url = movie.rottenTomatoes?.url;
  if (!url) return null;

  const withoutPrefix = url.replace(/^\{\d+\}/, "");
  const segments = withoutPrefix.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? null;
}

function getYear(movie: Movie): number | null {
  const year = movie.year ? parseInt(movie.year, 10) : NaN;
  return Number.isNaN(year) ? null : year;
}

/**
 * Lookup tables over the currently-showing films, so resolving a 300-entry list
 * is a handful of map hits per entry rather than a scan.
 */
type Lookups = {
  /** Keyed by TMDB id, which is the dataset's own movie id. */
  byTmdbId: Map<string, Movie>;
  byImdbId: Map<string, Movie>;
  byRtSlug: Map<string, Movie>;
  byTitleVariant: Map<string, Movie[]>;
};

function buildLookups(movies: Movie[]): Lookups {
  const byTmdbId = new Map<string, Movie>();
  const byImdbId = new Map<string, Movie>();
  const byRtSlug = new Map<string, Movie>();
  const byTitleVariant = new Map<string, Movie[]>();

  for (const movie of movies) {
    byTmdbId.set(movie.id, movie);

    const imdbId = movie.imdb?.id ?? movie.imdbId;
    if (imdbId && !byImdbId.has(imdbId)) byImdbId.set(imdbId, movie);

    const rtSlug = getRtSlug(movie);
    if (rtSlug && !byRtSlug.has(rtSlug)) byRtSlug.set(rtSlug, movie);

    for (const variant of getSearchVariants(movie.title)) {
      const existing = byTitleVariant.get(variant);
      if (existing) existing.push(movie);
      else byTitleVariant.set(variant, [movie]);
    }
  }

  return { byTmdbId, byImdbId, byRtSlug, byTitleVariant };
}

/**
 * The showing film a list entry refers to, or null if it isn't on in London.
 *
 * Tried in descending order of certainty: TMDB id (the dataset's own key), then
 * IMDb id, then Rotten Tomatoes slug, then title + year. The title fallback
 * matters because most published lists give nothing but a title and a year.
 */
function resolveEntry(
  entry: {
    title: string;
    altTitles?: string[];
    year?: number;
    imdbId?: string;
    rtSlug?: string;
    tmdbId?: string;
  },
  lookups: Lookups,
  yearTolerance: number,
): Movie | null {
  if (entry.tmdbId) {
    const byTmdbId = lookups.byTmdbId.get(entry.tmdbId);
    if (byTmdbId) return byTmdbId;
  }

  if (entry.imdbId) {
    const byId = lookups.byImdbId.get(entry.imdbId);
    if (byId) return byId;
  }

  if (entry.rtSlug) {
    const bySlug = lookups.byRtSlug.get(entry.rtSlug);
    if (bySlug) return bySlug;
  }

  const candidates = new Set<Movie>();
  for (const title of [entry.title, ...(entry.altTitles ?? [])]) {
    for (const variant of getSearchVariants(title)) {
      for (const movie of lookups.byTitleVariant.get(variant) ?? []) {
        candidates.add(movie);
      }
    }
  }
  if (candidates.size === 0) return null;

  // Without a year to check against, a bare title match is too loose to trust —
  // remakes and shared titles are common enough to produce real false hits.
  if (entry.year === undefined) {
    return candidates.size === 1 ? [...candidates][0] : null;
  }

  let best: Movie | null = null;
  let bestDistance = Infinity;
  for (const movie of candidates) {
    const year = getYear(movie);
    if (year === null) continue;
    const distance = Math.abs(year - entry.year);
    if (distance <= yearTolerance && distance < bestDistance) {
      best = movie;
      bestDistance = distance;
    }
  }

  return best;
}

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
  const lookups = buildLookups(showing);

  const byList = new Map<string, MovieListFilm[]>();
  const byMovie = new Map<string, MovieListMembership[]>();

  for (const list of lists) {
    const films: MovieListFilm[] = [];

    if (list.kind === "curated") {
      const seen = new Set<string>();
      // Entries are stored in published order, so pushing in order keeps the
      // countdown intact without a further sort.
      for (const entry of list.entries) {
        const movie = resolveEntry(
          entry,
          lookups,
          list.yearTolerance ?? DEFAULT_YEAR_TOLERANCE,
        );
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
