import type { GenreDefinition } from "@/data/genres";

/** Canonical path for a genre landing page. */
export function getGenreUrl(genre: Pick<GenreDefinition, "slug">): string {
  return `/genres/${genre.slug}`;
}
