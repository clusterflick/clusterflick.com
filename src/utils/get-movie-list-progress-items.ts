import type { MovieListProgressItem } from "@/app/personalise/seen-stats";
import { MOVIE_LISTS } from "@/data/movie-lists";
import { getMovieListImagePath } from "@/utils/get-movie-list-image";
import { getMovieListTmdbIds } from "@/utils/get-movie-list-tmdb-ids";
import { getMovieListUrl } from "@/utils/get-movie-list-url";

/**
 * The film lists as the Seen stats need them, for a reader's progress through
 * each: ~1,500 ids from the build, rather than every list file in the page's
 * bundle. Lists with no ids are left out, having nothing to count.
 */
export function getMovieListProgressItems(): MovieListProgressItem[] {
  return MOVIE_LISTS.map((list) => ({
    id: list.id,
    name: list.name,
    href: getMovieListUrl(list),
    imagePath: getMovieListImagePath(list.id),
    tmdbIds: getMovieListTmdbIds(list),
  })).filter(({ tmdbIds }) => tmdbIds.length > 0);
}
