import slugify from "@sindresorhus/slugify";

export function getVenueUrl(venue: { name: string }): string {
  return `/venues/${slugify(venue.name)}`;
}
