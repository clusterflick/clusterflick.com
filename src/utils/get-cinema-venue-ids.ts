import { Venue } from "@/types";

// Venue types that are considered "large" venues (excluded from small screenings)
const LARGE_VENUE_TYPES = ["Cinema", "Concert Hall/Theatre"];

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

/**
 * Filters venues to return only "small screening" venue IDs.
 * These are venues that are NOT cinemas or concert halls - typically bars,
 * community centres, museums, cultural institutes, etc.
 */
export function getSmallScreeningVenueIds(
  venues: Record<string, Venue> | null | undefined,
): string[] {
  if (!venues) return [];
  return Object.values(venues)
    .filter((venue) => !LARGE_VENUE_TYPES.includes(venue.type))
    .map((venue) => venue.id);
}
