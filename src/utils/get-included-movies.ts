import { IncludedMovie, Movie } from "@/types";

/**
 * Get included movies from any showing that has them.
 * Returns the first non-empty includedMovies array found.
 *
 * This is used for double/triple bills and special events that
 * include multiple films in a single showing.
 */
export function getIncludedMovies(
  showings: Movie["showings"],
): IncludedMovie[] | undefined {
  for (const showing of Object.values(showings)) {
    if (showing.includedMovies && showing.includedMovies.length > 0) {
      return showing.includedMovies;
    }
  }
  return undefined;
}
