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
    .filter((venue) => venue.type === "Cinema")
    .map((venue) => venue.id);
}
