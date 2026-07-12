import { readdirSync, existsSync } from "fs";
import { join } from "path";

const IMAGE_EXTENSIONS = [".png", ".svg", ".jpg"];

/** Path to a format's icon (named by slug), or null if none exists. */
export function getFormatImagePath(slug: string): string | null {
  const dir = join(process.cwd(), "public", "images", "formats");

  if (!existsSync(dir)) {
    return null;
  }

  const files = readdirSync(dir);

  for (const ext of IMAGE_EXTENSIONS) {
    if (files.includes(`${slug}${ext}`)) {
      return `/images/formats/${slug}${ext}`;
    }
  }

  return null;
}
