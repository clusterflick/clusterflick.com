import { Movie } from "@/types";

/**
 * Find multi-movie events that include the given movie.
 *
 * This is used to show "Also showing as part of" links on individual
 * movie pages when the film is included in multi-film events
 * (double bills, marathons, etc.).
 */
export function getContainingEvents(
  movieId: string,
  allMovies: Record<string, Movie>,
): Movie[] {
  const containingEvents: Movie[] = [];

  for (const event of Object.values(allMovies)) {
    // Skip the movie itself
    if (event.id === movieId) continue;

    // Check if this event's includedMovies contains our target movie
    if (event.includedMovies?.length) {
      const includesOurMovie = event.includedMovies.some(
        (included) => included.id === movieId,
      );
      if (includesOurMovie) {
        containingEvents.push(event);
      }
    }
  }

  return containingEvents;
}
