import { Venue } from "@/types";

/**
 * Filters venues to return only cinema venue IDs.
 * Centralizes the logic for determining which venues are cinemas.
 */
export function getCinemaVenueIds(
  venues: Record<string, Venue> | null | undefined,
): string[] {
  if (!venues) return [];
  return Object.values(venues)
    .filter((venue) => venue.programming === "cinema")
    .map((venue) => venue.id);
}

/**
 * Filters venues to return only "small screening" venue IDs.
 * These are the places that host screenings rather than programme them —
 * pubs, community centres, museums, cultural centres and the like. Venues
 * programmed as cinemas, and the substantial non-cinema venues (concert halls,
 * theatres), are both excluded.
 */
export function getSmallScreeningVenueIds(
  venues: Record<string, Venue> | null | undefined,
): string[] {
  if (!venues) return [];
  return Object.values(venues)
    .filter((venue) => venue.programming === "host")
    .map((venue) => venue.id);
}
