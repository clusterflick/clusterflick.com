import type { CinemaData, MetaData, Movie } from "../types";
import { getLondonMidnightTimestamp } from "./format-date";
import { pruneByPerformances } from "./prune-movies";

/**
 * The published listings (`data-format.mjs`) back into the shape the rest of
 * this package works on. The site's build leaves out what a reader can work
 * out for itself, to save bytes: every record's `id`, which is its key.
 *
 * Each function mutates what it's given, for speed: call them only on data
 * just parsed, before anything else holds it.
 */

type Keyed = Record<string, { id: string }>;

/** Each record's `id`, from its key. */
function restoreIds<T extends Keyed>(records: T): T {
  for (const id of Object.keys(records)) records[id].id = id;
  return records;
}

/** The meta file's venues, people, genres and collections, with their ids. */
export function expandMetaData(meta: MetaData): MetaData {
  restoreIds(meta.genres);
  restoreIds(meta.people);
  restoreIds(meta.venues);
  restoreIds(meta.collections);
  return meta;
}

/** A movie chunk's films and their showings, with their ids. */
export function expandMovies(movies: Record<string, Movie>) {
  restoreIds(movies);
  for (const movie of Object.values(movies)) restoreIds(movie.showings);
  return movies;
}

export const UNCATEGORISED_GENRE_NAME = "Uncategorised";
const UNCATEGORISED_GENRE_ID = "uncategorised";

/**
 * The "Uncategorised" genre's id, adding it to `genres` if the data has none,
 * so a film without a genre can still be found by genre.
 */
export function ensureUncategorisedGenre(
  genres: Record<string, { id: string; name: string }>,
): string {
  for (const genre of Object.values(genres)) {
    if (genre.name === UNCATEGORISED_GENRE_NAME) return genre.id;
  }
  genres[UNCATEGORISED_GENRE_ID] = {
    id: UNCATEGORISED_GENRE_ID,
    name: UNCATEGORISED_GENRE_NAME,
  };
  return UNCATEGORISED_GENRE_ID;
}

/**
 * Files a film under "Uncategorised" when it has no genres, or none the meta
 * file knows.
 */
export function assignUncategorisedGenre(
  movies: Record<string, Movie>,
  uncategorisedGenreId: string,
  validGenreIds: Set<string>,
): Record<string, Movie> {
  for (const movie of Object.values(movies)) {
    if (!movie.genres || movie.genres.length === 0) {
      movie.genres = [uncategorisedGenreId];
    } else if (!movie.genres.some((id) => validGenreIds.has(id))) {
      movie.genres = [...movie.genres, uncategorisedGenreId];
    }
  }
  return movies;
}

/**
 * Without performances before today in London, and so without the showings
 * and films left with none. Returns new records rather than mutating.
 */
export function stripPastPerformances(
  movies: Record<string, Movie>,
): Record<string, Movie> {
  const todayMidnight = getLondonMidnightTimestamp();
  return pruneByPerformances(movies, (perf) => perf.time >= todayMidnight);
}

/**
 * The listings as a reader sees them on the site, from the meta file and
 * every movie chunk it names, in any order: ids restored, films without a
 * genre filed as "Uncategorised", and nothing before today.
 */
export function readListings(
  meta: MetaData,
  chunks: Record<string, Movie>[],
): CinemaData {
  const expanded = expandMetaData(meta);
  const uncategorisedId = ensureUncategorisedGenre(expanded.genres);
  const validGenreIds = new Set(Object.keys(expanded.genres));
  const movies: Record<string, Movie> = {};
  for (const chunk of chunks) {
    Object.assign(
      movies,
      assignUncategorisedGenre(
        stripPastPerformances(expandMovies(chunk)),
        uncategorisedId,
        validGenreIds,
      ),
    );
  }
  return { ...expanded, movies };
}
