import slugify from "@sindresorhus/slugify";

/**
 * Generate the canonical URL for a movie detail page.
 */
export function getMovieUrl(movie: { id: string; title: string }): string {
  return `/movies/${movie.id}/${slugify(movie.title)}`;
}
