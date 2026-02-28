import { readdirSync, existsSync } from "fs";
import { join } from "path";

const IMAGE_EXTENSIONS = [".jpg", ".png", ".svg"];

export function getFilmClubImagePath(filmClubId: string): string | null {
  const dir = join(process.cwd(), "public", "images", "film-clubs");

  if (!existsSync(dir)) {
    return null;
  }

  const files = readdirSync(dir);

  for (const ext of IMAGE_EXTENSIONS) {
    if (files.includes(`${filmClubId}${ext}`)) {
      return `/images/film-clubs/${filmClubId}${ext}`;
    }
  }

  return null;
}
