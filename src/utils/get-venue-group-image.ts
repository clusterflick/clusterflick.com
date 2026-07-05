import { existsSync } from "fs";
import { join } from "path";

/**
 * Public path to a cinema group's generated location map, or null if it hasn't
 * been generated. Mirrors `getVenueMapPath`. Maps are produced by
 * `scripts/fetch-group-maps.js` into `public/images/venue-groups/<slug>.png`.
 */
export function getVenueGroupMapPath(slug: string): string | null {
  const filePath = join(
    process.cwd(),
    "public",
    "images",
    "venue-groups",
    `${slug}.png`,
  );
  if (existsSync(filePath)) {
    return `/images/venue-groups/${slug}.png`;
  }
  return null;
}
