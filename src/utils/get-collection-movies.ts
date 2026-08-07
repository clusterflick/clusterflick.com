import type { Collection, CollectionPart, Movie } from "@/types";

/**
 * One film in a collection. `movie` is set when the film is in the dataset with
 * upcoming performances; otherwise the entry is just the TMDB part, shown so a
 * collection page reads as the whole series rather than only the bookable half.
 */
export type CollectionEntry = {
  part: CollectionPart;
  /** The film's own listing, when it screens standalone. */
  movie?: Movie;
  /**
   * The double bill or marathon it screens inside, when it has no standalone
   * listing of its own. A film here is showing — you can buy a ticket — it just
   * can't be booked on its own, so the poster leads to the event instead.
   */
  event?: Movie;
  performanceCount: number;
};

/** Whether this film can be seen at all, standalone or inside an event. */
export const isShowing = (entry: CollectionEntry): boolean =>
  Boolean(entry.movie || entry.event);

export type CollectionScreenings = {
  /** Every film in the collection, in release order, showing ones first. */
  entries: CollectionEntry[];
  showing: CollectionEntry[];
  notShowing: CollectionEntry[];
};

function countUpcoming(movie: Movie, nowTs: number): number {
  let count = 0;
  for (const performance of movie.performances) {
    if (performance.time >= nowTs) count++;
  }
  return count;
}

/**
 * Pairs each film in a collection with its screenings.
 *
 * Films resolve by TMDB id, because the dataset is keyed by it — the same
 * direct lookup `get-movie-list-movies` starts with. A second pass then picks
 * up films that carry this `collectionId` but have no part: TMDB lists a
 * collection's unreleased entries without a release date, and those are dropped
 * when the collection is built, so a preview screening of a forthcoming sequel
 * would otherwise vanish from its own series.
 *
 * `nowTs` should be the data's generated-at timestamp so results are stable for
 * a given build.
 */
/**
 * Multi-film events — marathons, double bills — that include a film from this
 * collection, with upcoming performances. A marathon is a way to see several
 * instalments at once rather than an instalment itself, so these sit apart from
 * the release-ordered run and don't feed any of its counts.
 *
 * An event can span several collections (a Halloween all-nighter drawing on
 * Scream and A Nightmare on Elm Street), so it legitimately appears on more
 * than one page.
 */
export function getCollectionEvents(
  collection: Collection,
  movies: Record<string, Movie>,
  nowTs: number,
): { movie: Movie; performanceCount: number }[] {
  const events: { movie: Movie; performanceCount: number }[] = [];

  for (const movie of Object.values(movies)) {
    const includes = movie.includedMovies?.some(
      (included) => included.collectionId === collection.id,
    );
    if (!includes) continue;

    const performanceCount = countUpcoming(movie, nowTs);
    if (performanceCount > 0) events.push({ movie, performanceCount });
  }

  return events.sort(
    (a, b) =>
      b.performanceCount - a.performanceCount ||
      a.movie.normalizedTitle.localeCompare(b.movie.normalizedTitle),
  );
}

export function getCollectionScreenings(
  collection: Collection,
  movies: Record<string, Movie>,
  nowTs: number,
): CollectionScreenings {
  const claimed = new Set<string>();

  // Events carrying a film from this collection, in dataset order. A film can
  // be in more than one — the first is as good a link target as any, since a
  // poster can only lead to one place — so long as the choice is stable.
  const events = Object.values(movies).filter(
    (movie) =>
      movie.includedMovies?.some(
        (included) => included.collectionId === collection.id,
      ) && countUpcoming(movie, nowTs) > 0,
  );
  const eventShowing = (filmId: string) =>
    events.find((event) =>
      event.includedMovies?.some((included) => included.id === filmId),
    );

  const entries: CollectionEntry[] = collection.parts.map((part) => {
    const movie = movies[part.id];
    if (movie) {
      claimed.add(movie.id);
      const performanceCount = countUpcoming(movie, nowTs);
      if (performanceCount > 0) return { part, movie, performanceCount };
    }

    // No standalone listing, but a double bill or marathon may still be putting
    // it on screen.
    const event = eventShowing(part.id);
    if (event) {
      return { part, event, performanceCount: countUpcoming(event, nowTs) };
    }

    return { part, performanceCount: 0 };
  });

  for (const movie of Object.values(movies)) {
    if (movie.collectionId !== collection.id || claimed.has(movie.id)) continue;

    const performanceCount = countUpcoming(movie, nowTs);
    if (performanceCount === 0) continue;

    entries.push({
      part: {
        id: movie.id,
        title: movie.title,
        releaseDate: movie.releaseDate ?? "",
        posterPath: movie.posterPath,
      },
      movie,
      performanceCount,
    });
  }

  entries.sort((a, b) => a.part.releaseDate.localeCompare(b.part.releaseDate));

  const showing = entries.filter(isShowing);
  const notShowing = entries.filter((entry) => !isShowing(entry));

  return { entries, showing, notShowing };
}
