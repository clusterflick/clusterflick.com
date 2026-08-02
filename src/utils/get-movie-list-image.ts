import { readdirSync, existsSync } from "fs";
import { join } from "path";

const IMAGE_EXTENSIONS = [".jpg", ".png", ".svg"];

/**
 * Logo for a film list, looked up by the list's `id` in
 * `public/images/movie-lists/`. Drop in `<list-id>.svg` (or `.png` / `.jpg`)
 * and it is picked up automatically — no registry change needed.
 */
export function getMovieListImagePath(listId: string): string | null {
  const dir = join(process.cwd(), "public", "images", "movie-lists");

  if (!existsSync(dir)) {
    return null;
  }

  const files = readdirSync(dir);

  for (const ext of IMAGE_EXTENSIONS) {
    if (files.includes(`${listId}${ext}`)) {
      return `/images/movie-lists/${listId}${ext}`;
    }
  }

  return null;
}
