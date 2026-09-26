import { Movie } from "@/types";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/** URL query param used when sharing filters. */
export const MOVIES_URL_PARAM = "movies";

/**
 * Restricts the grid to a chosen set of films, by the id the dataset keys them
 * by (the same id a film's URL and a user list entry are built from).
 *
 * `[]` means *no filter*, as for directors and cast: the control is a
 * typeahead with no Select All, so an empty selection is just what removing
 * the last film leaves behind. `fromUrlParams` normalises it to `null`.
 *
 * Ids the dataset doesn't hold are kept, never pruned. A shared or bookmarked
 * link outlives the release it was made against, and a film that has finished
 * its run can come back — dropping its id would make the link quietly miss it
 * when it does. They simply match nothing meanwhile; everything that *counts*
 * or *names* the selection (overlay chips, the filter description) reads only
 * the ids the current dataset resolves.
 */
export const moviesFilter: FilterModule<FilterId.Movies> = {
  id: FilterId.Movies,

  getDefault: () => null,

  get: (state: FilterState) => state[FilterId.Movies],

  set: (state: FilterState, value: string[] | null): FilterState => ({
    ...state,
    [FilterId.Movies]: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    const value = state[FilterId.Movies];
    return !!value && value.length > 0;
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    const value = state[FilterId.Movies];
    if (!value || value.length === 0) return;
    params.set(MOVIES_URL_PARAM, value.join(","));
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (!params.has(MOVIES_URL_PARAM)) return undefined;
    const ids = params
      .get(MOVIES_URL_PARAM)!
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    return ids.length > 0 ? [...new Set(ids)] : null;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const selected = state[FilterId.Movies];
    if (!selected || selected.length === 0) return movies;

    const selectedSet = new Set(selected);
    const result: MoviesRecord = {};
    for (const [id, movie] of Object.entries(movies)) {
      if (selectedSet.has(id)) result[id] = movie;
    }
    return result;
  },
};

/** One selectable film, with how many upcoming performances it has. */
export type MovieOption = {
  id: string;
  /** Title with year, so a remake and its original stay distinguishable. */
  name: string;
  /** Performances in the dataset, for ordering and the typeahead's count. */
  count: number;
};

/**
 * Every film worth offering in the typeahead, most performances first.
 *
 * Ordered by performances because the quick-add stops at `maxResults` in list
 * order: a short query should surface the film on at forty screens before the
 * one-off with a similar name.
 */
export function getMovieVocabulary(
  movies: Record<string, Movie>,
): MovieOption[] {
  return Object.entries(movies)
    .map(([id, movie]) => ({
      id,
      name: movie.year ? `${movie.title} (${movie.year})` : movie.title,
      count: movie.performances?.length ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * The link that opens a page filtered to the given films — what "Explore
 * watchlist" and "Plan watchlist" point at.
 *
 * `base=all`, as for a person link: a watchlist is spread across the coming
 * months, and the today→+7d default would hide most of it.
 */
export function getMoviesFilterUrl(
  path: "/catalogue" | "/planner",
  movieIds: string[],
): string {
  // Each id encoded on its own so the separating commas stay readable.
  const ids = movieIds.map(encodeURIComponent).join(",");
  return `${path}?base=all&${MOVIES_URL_PARAM}=${ids}`;
}
