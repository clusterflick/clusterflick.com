import { readdirSync, existsSync } from "fs";
import { join } from "path";

const IMAGE_EXTENSIONS = [".png", ".svg", ".jpg"];

/** Path to a genre's icon (named by slug), or null if none exists. */
export function getGenreImagePath(slug: string): string | null {
  const dir = join(process.cwd(), "public", "images", "genres");

  if (!existsSync(dir)) {
    return null;
  }

  const files = readdirSync(dir);

  for (const ext of IMAGE_EXTENSIONS) {
    if (files.includes(`${slug}${ext}`)) {
      return `/images/genres/${slug}${ext}`;
    }
  }

  return null;
}
