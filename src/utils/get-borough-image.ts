import { existsSync } from "fs";
import { join } from "path";

/**
 * Public path to a borough's generated location map, or null if it hasn't been
 * generated. Mirrors `getVenueMapPath`. Maps are produced by
 * `scripts/fetch-borough-maps.js` into `public/images/boroughs/<slug>.png`.
 */
export function getBoroughMapPath(slug: string): string | null {
  const filePath = join(
    process.cwd(),
    "public",
    "images",
    "boroughs",
    `${slug}.png`,
  );
  if (existsSync(filePath)) {
    return `/images/boroughs/${slug}.png`;
  }
  return null;
}
