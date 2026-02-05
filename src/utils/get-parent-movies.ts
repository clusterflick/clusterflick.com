import { Movie } from "@/types";

/**
 * Find parent movies that include the given movie in their showings.
 * Returns movies that have this movie listed in their includedMovies.
 *
 * This is used to show "Part of" links on individual movie pages
 * that are included in multi-film events (double bills, marathons, etc.).
 */
export function getParentMovies(
  movieId: string,
  allMovies: Record<string, Movie>,
): Movie[] {
  const parentMovies: Movie[] = [];

  for (const potentialParent of Object.values(allMovies)) {
    // Skip the movie itself
    if (potentialParent.id === movieId) continue;

    // Check if any of this movie's showings include our target movie
    for (const showing of Object.values(potentialParent.showings)) {
      if (showing.includedMovies && showing.includedMovies.length > 0) {
        const hasOurMovie = showing.includedMovies.some(
          (included) => included.id === movieId,
        );
        if (hasOurMovie) {
          parentMovies.push(potentialParent);
          break; // Found it, no need to check other showings
        }
      }
    }
  }

  return parentMovies;
}
