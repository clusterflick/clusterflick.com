import type { Movie } from "../types";

/**
 * The multi-film events (double bills, marathons, all-nighters) that screen
 * the given film, as listings of their own.
 *
 * A marathon is its own listing, with the film among its `includedMovies`, so
 * nothing on the film's own record says it is screening there too. The film
 * page's "Part of" section and the MCP server's `get_film` both read it from
 * here, so a film answers for every way it can be seen. Matched by id, which
 * is the film's TMDB id on both sides.
 */
export function getContainingEvents(
  movieId: string,
  allMovies: Record<string, Movie>,
): Movie[] {
  const containingEvents: Movie[] = [];
  for (const event of Object.values(allMovies)) {
    if (event.id === movieId) continue;
    if (event.includedMovies?.some((included) => included.id === movieId)) {
      containingEvents.push(event);
    }
  }
  return containingEvents;
}
