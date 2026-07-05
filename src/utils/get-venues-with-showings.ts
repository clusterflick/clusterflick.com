import { CinemaData } from "@/types";

/**
 * Set of venue IDs that have at least one showing across the full dataset.
 *
 * Deliberately ignores the active filter state — a venue counts as having
 * showings if it screens anything at all (e.g. next week), even when the user
 * is currently filtered to a narrower window. Used to keep the "nearby" venue
 * detection focused on venues that can actually surface results.
 */
export function getVenueIdsWithShowings(
  movies: CinemaData["movies"],
): Set<string> {
  const venueIds = new Set<string>();
  for (const movie of Object.values(movies)) {
    for (const showing of Object.values(movie.showings)) {
      venueIds.add(showing.venueId);
    }
  }
  return venueIds;
}
