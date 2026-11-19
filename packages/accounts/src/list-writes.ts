import type { DocumentData } from "./firestore";
import type { FilmDetails, ListEntry } from "./lists";

/**
 * Films added to a reader's lists by a Worker, with the rules the site keeps
 * when it adds them (`addManyToUserList` in `@/lib/user-lists`):
 *
 * - **No film is listed without its details.** Each film comes with its
 *   genres and credits for `users/{uid}/meta/films`, and the caller writes
 *   both documents in one commit.
 * - **A film already on a list keeps its entry**, and so when it was added.
 * - **Everything already there is kept as it was stored**, read from the raw
 *   document rather than through `readList`, which drops what it can't read:
 *   writing a list back must never lose an entry the site might read.
 *
 * By default nothing here takes a film off a list. A caller can ask for a
 * film added to Seen to leave the watchlist (`seenLeavesWatchlist`), as the
 * site's add to Seen does: a reader marking a film seen has finished wanting
 * to see it. Only a film newly added to Seen in this write is ever taken off,
 * never one that was already there, so a film the reader has seen and put on
 * their watchlist here to see again stays on it.
 */

/** The lists a film can be added to, as the site's `UserListId`. */
export const ListField = Object.freeze({
  Watchlist: "watchlist",
  Seen: "seen",
});
export type ListField = (typeof ListField)[keyof typeof ListField];

export const filmDetailsPath = (uid: string) => `users/${uid}/meta/films`;

/** Top-billed cast kept per film, as the site's `FILM_DETAILS_CAST_LIMIT`. */
export const FILM_DETAILS_CAST_LIMIT = 5;

/**
 * Whether a film id is TheMovieDB's, as the site's `isTmdbId`: an unmatched
 * film's id is the pipeline's own, eight hex characters that can be all
 * digits, and TheMovieDB's are under eight digits with no leading zero.
 */
export function isTmdbId(id: unknown): id is string {
  return typeof id === "string" && /^[1-9]\d{0,6}$/.test(id);
}

/** A film to add, with everything the two documents keep about it. */
export type FilmToAdd = {
  /** TheMovieDB's id. */
  id: string;
  entry: ListEntry;
  details: FilmDetails;
  /** The names of the people `details` credits, by TheMovieDB id. */
  people: Record<string, string>;
};

/** What to write: whole fields, each the stored one with the films added. */
export type ListWrite = {
  /** For `users/{uid}`, by field. Only the lists that changed. */
  lists: Partial<Record<ListField, Record<string, unknown>>>;
  /** For `users/{uid}/meta/films`, or null when no film was added. */
  details: {
    films: Record<string, unknown>;
    people: Record<string, unknown>;
  } | null;
  /** The ids added to each list. */
  added: Record<ListField, string[]>;
  /** The ids taken off the watchlist, having been added to Seen. */
  removed: { watchlist: string[] };
};

export type AddToListsOptions = {
  /**
   * Whether a film newly added to Seen leaves the watchlist, by id. Not
   * given, none does. A film added to the watchlist in the same write
   * always stays.
   */
  seenLeavesWatchlist?: (id: string) => boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A stored map field, or an empty one if it isn't there. Anything else
 * there is refused: writing over it would lose what it holds.
 */
function storedMap(
  data: DocumentData | null,
  field: string,
): Record<string, unknown> {
  const value = data?.[field];
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new TypeError(`${field} isn't a map, so it won't be written over`);
  }
  return value;
}

function checkFilm(film: FilmToAdd) {
  if (!isTmdbId(film.id)) {
    throw new TypeError(`Not a TheMovieDB film id: ${film.id}`);
  }
  if (!film.entry.title) throw new TypeError(`Film ${film.id} has no title`);
  for (const person of [...film.details.directors, ...film.details.cast]) {
    if (!film.people[person]) {
      throw new TypeError(`Film ${film.id} credits ${person} with no name`);
    }
  }
  if (film.details.cast.length > FILM_DETAILS_CAST_LIMIT) {
    throw new TypeError(`Film ${film.id} has more than the cast kept`);
  }
}

/**
 * The lists and the details with `additions` added, from the documents as
 * read: `user` is `users/{uid}`, `films` is `users/{uid}/meta/films` (each
 * decoded, or null if there's none). Films already on a list are skipped.
 * Throws, writing nothing, for a film without what the site needs of it.
 */
export function addToLists(
  user: DocumentData | null,
  films: DocumentData | null,
  additions: Partial<Record<ListField, FilmToAdd[]>>,
  { seenLeavesWatchlist }: AddToListsOptions = {},
): ListWrite {
  const lists: ListWrite["lists"] = {};
  const added: ListWrite["added"] = { watchlist: [], seen: [] };
  const newFilms: Record<string, unknown> = {};
  const newPeople: Record<string, string> = {};

  for (const field of Object.values(ListField)) {
    const toAdd = additions[field] ?? [];
    if (toAdd.length === 0) continue;
    const list = { ...storedMap(user, field) };
    for (const film of toAdd) {
      checkFilm(film);
      if (film.id in list) continue;
      // Firestore rejects undefined, so absent fields are left out.
      list[film.id] = {
        title: film.entry.title,
        ...(film.entry.year && { year: film.entry.year }),
        ...(film.entry.posterPath && { posterPath: film.entry.posterPath }),
        addedAt: film.entry.addedAt,
      };
      added[field].push(film.id);
      newFilms[film.id] = {
        genres: film.details.genres,
        directors: film.details.directors,
        cast: film.details.cast,
        ...(film.details.runtime && { runtime: film.details.runtime }),
        ...(film.details.language && { language: film.details.language }),
      };
      for (const person of [...film.details.directors, ...film.details.cast]) {
        newPeople[person] = film.people[person];
      }
    }
    if (added[field].length > 0) lists[field] = list;
  }

  const removed: ListWrite["removed"] = { watchlist: [] };
  if (seenLeavesWatchlist) {
    const watchlist = { ...(lists.watchlist ?? storedMap(user, "watchlist")) };
    for (const id of added.seen) {
      if (!(id in watchlist) || added.watchlist.includes(id)) continue;
      if (!seenLeavesWatchlist(id)) continue;
      // Its details stay, as the site's removal leaves them.
      delete watchlist[id];
      removed.watchlist.push(id);
    }
    if (removed.watchlist.length > 0) lists.watchlist = watchlist;
  }

  const details =
    Object.keys(newFilms).length === 0
      ? null
      : {
          // Newer details win, as the site's merged write lets them.
          films: { ...storedMap(films, "films"), ...newFilms },
          people: { ...storedMap(films, "people"), ...newPeople },
        };
  return { lists, details, added, removed };
}
