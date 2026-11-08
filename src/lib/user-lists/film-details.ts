import type { Movie, Person } from "@/types";
import { fetchTmdbDetails, type TmdbFilmDetails } from "@/lib/tmdb-search";

/**
 * Top-billed cast kept per film. "Favourite actor" is about leading roles,
 * and every credit past them is bytes in a document with a 1 MiB limit.
 */
export const FILM_DETAILS_CAST_LIMIT = 5;

/**
 * What the lists' stats and filters know about a film beyond its entry. Ids
 * are TheMovieDB's: the dataset's genre and person ids are TheMovieDB's own,
 * so details captured from it and fetched from TheMovieDB later agree.
 */
export type FilmDetails = {
  genres: string[];
  directors: string[];
  /** Billing order, cut to `FILM_DETAILS_CAST_LIMIT`. */
  cast: string[];
  /** Minutes. */
  runtime?: number;
  /** ISO 639-1 code of the original language. */
  language?: string;
};

/**
 * The companion document at `users/{uid}/meta/films`. Kept apart from the
 * lists because the lists load on every page for the poster markers, and this
 * is only for /personalise. Names are stored once in `people` rather than on
 * every film: a favourite director turns up on dozens.
 *
 * It can hold films that are on no list any more — removing a film leaves its
 * details behind — so a reader joins it on the lists, never reads it alone.
 */
export type FilmDetailsData = {
  films: Record<Movie["id"], FilmDetails>;
  people: Record<Person["id"], string>;
};

export const EMPTY_FILM_DETAILS: FilmDetailsData = { films: {}, people: {} };

/** Fields of a dataset film the details are built from. */
export type FilmDetailsSource = Pick<
  Movie,
  | "id"
  | "isUnmatched"
  | "genres"
  | "directors"
  | "actors"
  | "duration"
  | "originalLanguage"
>;

/**
 * Builds the details of dataset films, ready to merge into the document.
 *
 * An unmatched film is skipped: it has no TheMovieDB record, and its genres
 * are only what the venue's categories happened to name (or the Uncategorised
 * placeholder), so counting them would be a guess. A person whose name the
 * lookup doesn't hold is left off the film rather than stored nameless.
 */
export function collectFilmDetails(
  movies: FilmDetailsSource[],
  people: Record<Person["id"], Pick<Person, "name">>,
): FilmDetailsData {
  const result: FilmDetailsData = { films: {}, people: {} };
  const named = (ids: string[] = []) =>
    ids.filter((id) => {
      const name = people[id]?.name;
      if (name) result.people[id] = name;
      return !!name;
    });

  for (const movie of movies) {
    if (movie.isUnmatched) continue;
    const runtime = movie.duration
      ? Math.round(movie.duration / 60000)
      : undefined;
    // Firestore rejects `undefined` values, so absent fields are left out.
    result.films[movie.id] = {
      genres: movie.genres ?? [],
      directors: named(movie.directors),
      cast: named(movie.actors?.slice(0, FILM_DETAILS_CAST_LIMIT)),
      ...(runtime && { runtime }),
      // The dataset names the language only when it isn't English.
      language: movie.originalLanguage ?? "en",
    };
  }
  return result;
}

/**
 * Whether a listed film's id is TheMovieDB's. An unmatched film's id is the
 * pipeline's own: eight hex characters, sometimes all digits, and asking TMDB
 * about one of those would describe a different film, or none. TMDB's ids are
 * under eight digits (about 1.6 million in 2026) and never start with a zero,
 * so the two can't be confused until TMDB passes ten million films.
 */
export function isTmdbId(id: string) {
  return /^[1-9]\d{0,6}$/.test(id);
}

/** Details from the search Worker, ready to merge into the document. */
export function fromTmdbDetails(results: TmdbFilmDetails[]): FilmDetailsData {
  const data: FilmDetailsData = { films: {}, people: {} };
  for (const film of results) {
    for (const person of [...film.directors, ...film.cast]) {
      data.people[person.id] = person.name;
    }
    data.films[film.id] = {
      genres: film.genres,
      directors: film.directors.map(({ id }) => id),
      cast: film.cast.slice(0, FILM_DETAILS_CAST_LIMIT).map(({ id }) => id),
      ...(film.runtime && { runtime: film.runtime }),
      ...(film.language && { language: film.language }),
    };
  }
  return data;
}

/** The details of just `ids`, and only the names those films use. */
export function pickFilmDetails(
  details: FilmDetailsData,
  ids: Movie["id"][],
): FilmDetailsData {
  const picked: FilmDetailsData = { films: {}, people: {} };
  for (const id of ids) {
    const film = details.films[id];
    if (!film) continue;
    picked.films[id] = film;
    for (const person of [...film.directors, ...film.cast]) {
      const name = details.people[person];
      if (name) picked.people[person] = name;
    }
  }
  return picked;
}

/**
 * Details for films that aren't in the dataset, from TMDB through the search
 * Worker. Every id must be a film TMDB has: they come from TMDB's own search
 * or match, so one it can't describe is an error, not a film without details.
 */
export async function fetchFilmDetailsFromTmdb(
  ids: Movie["id"][],
  getIdToken: (forceRefresh?: boolean) => Promise<string>,
  signal?: AbortSignal,
): Promise<FilmDetailsData> {
  const results = await fetchTmdbDetails(ids, getIdToken, signal);
  const missing = ids.filter((_, index) => !results[index]);
  if (missing.length > 0) {
    throw new Error(`TMDB has no details for ${missing.join(", ")}`);
  }
  return fromTmdbDetails(results.flatMap((film) => film ?? []));
}
