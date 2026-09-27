import { readdirSync, existsSync } from "fs";
import { join } from "path";

const IMAGE_EXTENSIONS = [".jpg", ".png", ".svg"];

export function getVenueImagePath(venueId: string): string | null {
  const dir = join(process.cwd(), "public", "images", "venues");
  const files = readdirSync(dir);

  for (const ext of IMAGE_EXTENSIONS) {
    if (files.includes(`${venueId}${ext}`)) {
      return `/images/venues/${venueId}${ext}`;
    }
  }

  return null;
}

/**
 * Every venue logo, keyed by venue id — for a client page that can't know at
 * build time which venues it will show, as `/personalise` can't.
 */
export function getVenueImagePaths(): Record<string, string> {
  const dir = join(process.cwd(), "public", "images", "venues");
  const paths: Record<string, string> = {};
  // Reversed so the first extension in IMAGE_EXTENSIONS wins, as it does above.
  for (const ext of [...IMAGE_EXTENSIONS].reverse()) {
    for (const file of readdirSync(dir)) {
      if (file.endsWith(ext)) {
        paths[file.slice(0, -ext.length)] = `/images/venues/${file}`;
      }
    }
  }
  return paths;
}

export function getVenueMapPath(venueId: string): string | null {
  const filePath = join(
    process.cwd(),
    "public",
    "images",
    "venues",
    "maps",
    `${venueId}.png`,
  );
  if (existsSync(filePath)) {
    return `/images/venues/maps/${venueId}.png`;
  }
  return null;
}
