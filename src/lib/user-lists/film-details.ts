import type { Movie, Person } from "@/types";
import type { TmdbFilmDetails } from "@/lib/tmdb-search";

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

export type FilmDetailsPlan = {
  /** Listed films without details whose details the dataset holds. */
  fromDataset: FilmDetailsSource[];
  /** Listed films without details to look up on TMDB. */
  fromTmdb: Movie["id"][];
  /** Films with details that are on no list any more. */
  staleFilms: Movie["id"][];
};

/**
 * What it takes to bring the details in line with the lists. A film in the
 * dataset is read from it, which costs nothing; one that isn't is looked up
 * on TMDB if its id is TMDB's. An unmatched film gets neither — see
 * `collectFilmDetails` — and is left without details for good.
 */
export function planFilmDetailsSync(
  listedIds: Iterable<Movie["id"]>,
  details: FilmDetailsData,
  movies: Record<Movie["id"], FilmDetailsSource | undefined>,
): FilmDetailsPlan {
  const listed = new Set(listedIds);
  const plan: FilmDetailsPlan = {
    fromDataset: [],
    fromTmdb: [],
    staleFilms: [],
  };
  for (const id of listed) {
    if (id in details.films) continue;
    const movie = movies[id];
    if (movie) {
      if (!movie.isUnmatched) plan.fromDataset.push(movie);
    } else if (isTmdbId(id)) {
      plan.fromTmdb.push(id);
    }
  }
  plan.staleFilms = Object.keys(details.films).filter((id) => !listed.has(id));
  return plan;
}

/**
 * People the remaining films no longer name, once `removedFilms` are gone and
 * `added` is merged in. Names are kept once for every film, so they outlive a
 * film only if another one names them.
 */
export function getStalePeople(
  details: FilmDetailsData,
  added: FilmDetailsData,
  removedFilms: Movie["id"][],
): string[] {
  const removed = new Set(removedFilms);
  const named = new Set<string>();
  const films = { ...details.films, ...added.films };
  for (const [id, film] of Object.entries(films)) {
    if (removed.has(id)) continue;
    for (const person of [...film.directors, ...film.cast]) named.add(person);
  }
  return Object.keys(details.people).filter((id) => !named.has(id));
}
