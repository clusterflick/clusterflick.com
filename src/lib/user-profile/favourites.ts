/**
 * A reader's favourite films, pinned at the top of their profile: up to four,
 * in the order they put them, as Letterboxd's Four Favourites are.
 *
 * Each is its own snapshot, not a reference into the Seen list. Favourites
 * are a statement a reader makes once, and tidying the Seen list shouldn't
 * undo it; a hidden Seen list stays wholly hidden, rather than hidden but for
 * four films pulled out of it; and a reader with no Seen list yet can still
 * pick them. They're picked from the Seen list first, since that's where
 * favourites almost always are, and from TheMovieDB for anything else.
 *
 * Checked as they're saved (the rules' `isFavourites`, held to this module by
 * a test) and as they're read, by the profiles Worker and by the page.
 */

export const FAVOURITES_MAX = 4;

/** As a list entry snapshots a film: enough to draw it, and link it. */
export type FavouriteFilm = {
  /** TheMovieDB's id, or the pipeline's for an unmatched film. */
  id: string;
  title: string;
  year?: string;
  posterPath?: string;
};

export const FAVOURITE_TITLE_MAX_LENGTH = 300;

/**
 * A film's id as a path segment of its page's address. Both kinds of id fit:
 * TheMovieDB's digits and the pipeline's hex.
 */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
const YEAR_PATTERN = /^[0-9]{4}$/;
/** A TheMovieDB image path, appended to its image host's address. */
const POSTER_PATH_PATTERN = /^\/[A-Za-z0-9._-]{1,100}$/;

/** The patterns' sources, for the test holding the rules to them. */
export const FAVOURITE_PATTERN_SOURCES = {
  id: ID_PATTERN.source,
  year: YEAR_PATTERN.source,
  posterPath: POSTER_PATH_PATTERN.source,
} as const;

/**
 * A film as a favourite, from a list entry, a film in the dataset or a
 * TheMovieDB result. A year or poster that doesn't fit is left off rather
 * than refusing the film; an id or title that doesn't fit is no favourite.
 */
export function toFavouriteFilm(
  id: string,
  film: { title: string; year?: string; posterPath?: string },
): FavouriteFilm | null {
  const title = film.title.trim();
  if (
    !ID_PATTERN.test(id) ||
    !title ||
    title.length > FAVOURITE_TITLE_MAX_LENGTH
  ) {
    return null;
  }
  return {
    id,
    title,
    ...(film.year && YEAR_PATTERN.test(film.year) && { year: film.year }),
    ...(film.posterPath &&
      POSTER_PATH_PATTERN.test(film.posterPath) && {
        posterPath: film.posterPath,
      }),
  };
}

function readFavourite(value: unknown): FavouriteFilm | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const { id, title, year, posterPath } = value as Record<string, unknown>;
  if (typeof id !== "string" || typeof title !== "string") return null;
  return toFavouriteFilm(id, {
    title,
    ...(typeof year === "string" && { year }),
    ...(typeof posterPath === "string" && { posterPath }),
  });
}

/**
 * Saved favourites as they're shown: what can't be drawn dropped, a film
 * repeated kept once, and no more than four. The rules allow nothing else,
 * but a hand edit skips them.
 */
export function readFavourites(value: unknown): FavouriteFilm[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const favourites: FavouriteFilm[] = [];
  for (const item of value) {
    const favourite = readFavourite(item);
    if (!favourite || seen.has(favourite.id)) continue;
    seen.add(favourite.id);
    favourites.push(favourite);
    if (favourites.length === FAVOURITES_MAX) break;
  }
  return favourites;
}

export const sameFavourites = (a: FavouriteFilm[], b: FavouriteFilm[] = []) =>
  a.length === b.length && a.every((film, index) => film.id === b[index].id);
