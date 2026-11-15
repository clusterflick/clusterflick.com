import slugify from "@sindresorhus/slugify";

/**
 * Appended to a movie URL to open its page with every performance listed,
 * ignoring the filters the reader has set. Read by the movie page on mount and
 * on `hashchange`, so it works as a link target as well as a toggle.
 */
export const SHOW_ALL_HASH = "#show-all";

/**
 * Generate the canonical URL for a movie detail page.
 */
export function getMovieUrl(movie: { id: string; title: string }): string {
  return `/movies/${movie.id}/${slugify(movie.title)}`;
}
