import type { VenueGroup } from "@/data/venue-groups";

export function getVenueGroupUrl(group: Pick<VenueGroup, "slug">): string {
  return `/cinema-groups/${group.slug}`;
}

/**
 * Page title for a group, e.g. "London Picturehouse Cinemas". Groups whose name
 * already contains "Cinema" (e.g. "Castle Cinema", "Rooftop Cinema Club") drop
 * the trailing "Cinemas" to avoid an awkward "…Cinema Cinemas".
 */
export function getVenueGroupTitle(name: string): string {
  return /cinema/i.test(name) ? `London ${name}` : `London ${name} Cinemas`;
}

/**
 * Longer form used in prose like "Part of the {…} group", e.g. "Curzon Cinema".
 * Appends "Cinema" when the name doesn't already contain it, unless the group
 * provides an explicit `fullName` override (for names that don't read well with
 * "Cinema" appended, e.g. "BFI", "Olympic Studios").
 */
export function getVenueGroupProseName(
  group: Pick<VenueGroup, "name" | "fullName">,
): string {
  if (group.fullName) return group.fullName;
  return /cinema/i.test(group.name) ? group.name : `${group.name} Cinema`;
}
