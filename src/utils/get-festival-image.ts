import { readdirSync, existsSync } from "fs";
import { join } from "path";

const IMAGE_EXTENSIONS = [".jpg", ".png", ".svg"];

export function getFestivalImagePath(festivalId: string): string | null {
  const dir = join(process.cwd(), "public", "images", "festivals");

  if (!existsSync(dir)) {
    return null;
  }

  const files = readdirSync(dir);

  for (const ext of IMAGE_EXTENSIONS) {
    if (files.includes(`${festivalId}${ext}`)) {
      return `/images/festivals/${festivalId}${ext}`;
    }
  }

  return null;
}
