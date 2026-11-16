import type { IncludedMovie, Movie } from "../types";

export type IncludedListing = {
  /** The film as the event lists it. */
  film: IncludedMovie;
  /** The film's own listing, when it is also showing on its own. */
  listing?: Movie;
};

/**
 * The films a multi-film event (a double bill, marathon, all-nighter) screens,
 * each with its own listing when it is also showing on its own.
 *
 * The reverse of `getContainingEvents`: a marathon names its films, but nothing
 * on the marathon says the films in it are on elsewhere too. The film page's
 * "Included Films" and the MCP server's `get_film` both read it from here, so
 * an event answers for every other way to see what it screens. Matched by id,
 * which is the film's TMDB id on both sides, as `getContainingEvents` matches;
 * an event that is itself matched to one of its films is not that film's
 * listing.
 *
 * In the event's own order, with every film kept whether it has a listing or
 * not, since the event screens them all.
 */
export function getIncludedListings(
  event: Pick<Movie, "id" | "includedMovies">,
  allMovies: Record<string, Movie>,
): IncludedListing[] {
  return (event.includedMovies ?? []).map((film) => {
    const listing = film.id === event.id ? undefined : allMovies[film.id];
    return listing ? { film, listing } : { film };
  });
}
