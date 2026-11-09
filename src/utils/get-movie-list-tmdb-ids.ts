import type { MovieList } from "@/data/movie-lists";

/**
 * The films a curated list names, by TMDB id, once each: the ids a reader's
 * Seen list is held against for their progress through it. An entry TMDB has
 * no film for (`null`) can't be seen, so it isn't counted, and two entries on
 * one film count once. A computed list has no fixed membership, so none.
 *
 * Passed from the build to the pages that show progress, so the list files
 * themselves never ship to the browser.
 */
export function getMovieListTmdbIds(list: MovieList): string[] {
  if (list.kind !== "curated") return [];
  const ids = new Set<string>();
  for (const entry of list.entries) {
    if (entry.tmdbId) ids.add(entry.tmdbId);
  }
  return [...ids];
}
