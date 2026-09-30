import { getLetterboxdRating } from "@/utils/movie-ratings.mjs";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/** URL query param used when sharing filters. */
export const LETTERBOXD_RATING_URL_PARAM = "letterboxd";

/**
 * The slider's range. Letterboxd averages bunch between 3.5 and 4.3 — in a
 * live release 282 showing films were rated 3.0+, 80 were 4.0+ and 6 were
 * 4.5+ — so the range covers where a threshold actually separates films, in
 * steps fine enough to move through that band.
 */
export const LETTERBOXD_RATING_MIN = 3.0;
export const LETTERBOXD_RATING_MAX = 4.5;
export const LETTERBOXD_RATING_STEP = 0.1;

/** The threshold the home page's Highly Rated row uses. */
export const HIGHLY_RATED_MIN_LETTERBOXD = 4.0;

/** Rounds to the slider's step, so 3.95 and 4.0 are the same filter. */
function toStep(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Whether a film is rated at least `min` on Letterboxd. Compared at one
 * decimal place, because that is how a rating is shown: a film averaging 3.96
 * reads "4.0/5" on its poster, and "4.0+" leaving it out would contradict it.
 */
export function meetsLetterboxdRating(
  movie: Parameters<typeof getLetterboxdRating>[0],
  min: number,
): boolean {
  const rating = getLetterboxdRating(movie);
  return rating !== null && toStep(rating) >= min;
}

/**
 * Restricts the grid to films averaging at least a given rating on Letterboxd,
 * counting only films with enough reviews for the average to mean something
 * (`LETTERBOXD_MIN_REVIEWS`, shared with every other rating reader). A film
 * without that many reviews has no rating here, so any threshold excludes it.
 *
 * `null` means no filter. A film-level filter: every showing of a film has the
 * same rating, so nothing is pruned below the film.
 */
export const letterboxdRatingFilter: FilterModule<FilterId.LetterboxdRating> = {
  id: FilterId.LetterboxdRating,

  getDefault: () => null,

  get: (state: FilterState) => state[FilterId.LetterboxdRating],

  set: (state: FilterState, value: number | null): FilterState => ({
    ...state,
    [FilterId.LetterboxdRating]: value,
  }),

  hasActiveFilter: (state: FilterState): boolean =>
    state[FilterId.LetterboxdRating] !== null,

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    const value = state[FilterId.LetterboxdRating];
    if (value === null) return;
    params.set(LETTERBOXD_RATING_URL_PARAM, value.toFixed(1));
  },

  // Out-of-range values are clamped rather than rejected: a link asking for
  // 4.7 still means "the very best", which the top of the slider answers.
  fromUrlParams: (params: URLSearchParams) => {
    if (!params.has(LETTERBOXD_RATING_URL_PARAM)) return undefined;
    const value = Number.parseFloat(params.get(LETTERBOXD_RATING_URL_PARAM)!);
    if (!Number.isFinite(value)) return null;
    return toStep(
      Math.min(LETTERBOXD_RATING_MAX, Math.max(LETTERBOXD_RATING_MIN, value)),
    );
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const min = state[FilterId.LetterboxdRating];
    if (min === null) return movies;

    const result: MoviesRecord = {};
    for (const [id, movie] of Object.entries(movies)) {
      if (meetsLetterboxdRating(movie, min)) result[id] = movie;
    }
    return result;
  },
};

/**
 * The link behind the Highly Rated row's "See all": the catalogue's default
 * week and categories, which are the row's too, at the row's threshold.
 */
export function getHighlyRatedUrl(): string {
  return `/catalogue?${LETTERBOXD_RATING_URL_PARAM}=${HIGHLY_RATED_MIN_LETTERBOXD.toFixed(1)}`;
}
