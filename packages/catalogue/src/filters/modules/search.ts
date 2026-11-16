import type { Movie } from "../../types";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { matchesSearchQuery, normalizeForSearch } from "../normalize";

/**
 * Whether any of a film's other English release titles match an
 * already-normalized query: the UK title of a film displayed under its US one
 * (searching "Zootropolis" finds Zootopia).
 */
function matchesAlternativeTitle(
  movie: Pick<Movie, "alternativeTitles">,
  query: string,
): boolean {
  return (movie.alternativeTitles ?? []).some((title) =>
    matchesSearchQuery(title, query),
  );
}

/**
 * Whether a film's own titles match an already-normalized query: alternative
 * spellings of both titles, the original-language title for foreign-language
 * films (e.g. searching "Fabuleux" finds Amélie), and the other English titles
 * it was released under.
 */
function matchesOwnTitle(
  movie: Pick<
    Movie,
    "title" | "normalizedTitle" | "originalTitle" | "alternativeTitles"
  >,
  query: string,
): boolean {
  return (
    matchesSearchQuery(movie.normalizedTitle || "", query) ||
    matchesSearchQuery(movie.title, query) ||
    (!!movie.originalTitle && matchesSearchQuery(movie.originalTitle, query)) ||
    matchesAlternativeTitle(movie, query)
  );
}

/**
 * The film of `movie`'s screens whose title matches an already-normalized
 * query, if `movie` is a multi-film event matched only through one of them.
 *
 * A double bill, marathon or all-dayer is listed under its own name, which
 * rarely says what it screens: "Programmers of Tomorrow: Film Festival
 * All-Dayer" screens "Talking About Trees". Someone searching for the film
 * wants to know they can see it, so the event answers for the films in it, as
 * it already does for their genres and credits (`getMovieAndIncluded`).
 */
export function findIncludedTitleMatch(
  movie: Pick<Movie, "includedMovies">,
  query: string,
): string | undefined {
  for (const film of movie.includedMovies ?? []) {
    if (
      matchesSearchQuery(film.normalizedTitle || "", query) ||
      matchesSearchQuery(film.title, query) ||
      matchesAlternativeTitle(film, query)
    ) {
      return film.title;
    }
  }
  return undefined;
}

/**
 * Whether the title search finds `movie` for an already-normalized query: by
 * its own titles, or by the title of a film it screens.
 */
export function matchesTitleSearch(
  movie: Pick<
    Movie,
    | "title"
    | "normalizedTitle"
    | "originalTitle"
    | "alternativeTitles"
    | "includedMovies"
  >,
  query: string,
): boolean {
  return (
    matchesOwnTitle(movie, query) ||
    findIncludedTitleMatch(movie, query) !== undefined
  );
}

/**
 * Search filter module.
 * Filters movies by title (case-insensitive, accent-insensitive, punctuation-forgiving match),
 * including the titles of the films a multi-film event screens.
 */
export const searchFilter: FilterModule<FilterId.Search> = {
  id: FilterId.Search,

  getDefault: () => "",

  get: (state: FilterState) => state.search,

  set: (state: FilterState, value: string): FilterState => ({
    ...state,
    search: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    return (state.search ?? "").trim().length > 0;
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    if ((state.search ?? "").trim().length > 0) {
      params.set("search", state.search);
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (params.has("search")) {
      return params.get("search")!;
    }
    return undefined;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const query = normalizeForSearch(state.search ?? "");

    // No search query = no filtering
    if (query.length === 0) {
      return movies;
    }

    const result: MoviesRecord = {};

    for (const [id, movie] of Object.entries(movies)) {
      if (matchesTitleSearch(movie, query)) {
        result[id] = movie;
      }
    }

    return result;
  },
};
