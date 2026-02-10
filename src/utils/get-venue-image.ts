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
