import type { Movie } from "@/types";
import {
  getLetterboxdRating,
  getImdbRating,
  getRottenTomatoesScore,
  LETTERBOXD_MIN_REVIEWS,
  IMDB_MIN_REVIEWS,
  RT_MIN_REVIEWS,
} from "@/utils/movie-ratings.mjs";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/** The three rating filter IDs. Each reads one source's score. */
export type RatingFilterId =
  | FilterId.LetterboxdRating
  | FilterId.ImdbRating
  | FilterId.RottenTomatoesRating;

type RatingSubject = Pick<Movie, "letterboxd" | "imdb" | "rottenTomatoes">;

export type RatingGroupConfig = {
  filterId: RatingFilterId;
  /** The source's name, as the slider and descriptions give it. */
  source: string;
  /** URL query param used when sharing filters. */
  urlParam: string;
  /** The film's score on this source, or null when it has too few reviews. */
  read: (movie: RatingSubject) => number | null;
  /** The review floor behind `read`, for the note under the slider. */
  minReviews: number;
  /** What the floor counts: "reviews", "critic reviews", "votes". */
  reviewNoun: string;
  /** The slider's range and step. */
  min: number;
  max: number;
  step: number;
  /** Decimal places a score is shown at, and so compared at. */
  decimals: number;
  /** "4.2/5", "96%" — a score as the site writes it. */
  formatScore: (value: number) => string;
  /** "4.0+", "95%+" — a minimum as the site writes it. */
  formatMin: (value: number) => string;
  /** Completes the slider's value: "4.0+ out of 5". */
  scale: string;
  /**
   * Where "highly rated" starts on this source: roughly its top quarter of
   * the films showing in a week, measured on a live release. Not a common
   * fraction of each maximum, because the scales don't behave alike — see
   * the note on RATING_GROUPS.
   */
  highlyRated: number;
};

/**
 * Config for the three rating sources, shared by the filter modules (below),
 * the overlay's sliders, the filter description and the suggestion engine.
 *
 * Each source gets its own filter rather than one blended score, because the
 * sources don't measure the same thing: Letterboxd and IMDb publish an
 * average, Rotten Tomatoes the share of critics who liked a film. Of 193 films
 * carrying both a Letterboxd average and a Tomatometer score, 73 fell on
 * opposite sides of an 80% line.
 *
 * The same scales set each source's "highly rated" line. Measured against the
 * films showing in one live week, each line takes roughly the top quarter of
 * what that source rates: Letterboxd 4.0+ was 80 of 307 (26%), IMDb 8.0+ 45 of
 * 191 (24%), Rotten Tomatoes 95%+ 43 of 198 (22%). The old shared 80% line
 * matched the first two but let in 66% of Rotten Tomatoes' films, whose
 * scores bunch between 85 and 98 — well-known films with 40+ critic reviews
 * are mostly well liked.
 *
 * Slider ranges cover where a threshold separates films, not the whole scale:
 * nobody browses for films rated 1.5 and up.
 */
export const RATING_GROUPS: RatingGroupConfig[] = [
  {
    filterId: FilterId.LetterboxdRating,
    source: "Letterboxd",
    urlParam: "letterboxd",
    read: getLetterboxdRating,
    minReviews: LETTERBOXD_MIN_REVIEWS,
    reviewNoun: "reviews",
    min: 3.0,
    max: 4.5,
    step: 0.1,
    decimals: 1,
    formatScore: (value) => `${value.toFixed(1)}/5`,
    formatMin: (value) => `${value.toFixed(1)}+`,
    scale: "out of 5",
    highlyRated: 4.0,
  },
  {
    filterId: FilterId.ImdbRating,
    source: "IMDb",
    urlParam: "imdb",
    read: getImdbRating,
    minReviews: IMDB_MIN_REVIEWS,
    reviewNoun: "votes",
    min: 6.0,
    max: 9.0,
    step: 0.1,
    decimals: 1,
    formatScore: (value) => `${value.toFixed(1)}/10`,
    formatMin: (value) => `${value.toFixed(1)}+`,
    scale: "out of 10",
    highlyRated: 8.0,
  },
  {
    filterId: FilterId.RottenTomatoesRating,
    source: "Rotten Tomatoes",
    urlParam: "rottenTomatoes",
    read: getRottenTomatoesScore,
    minReviews: RT_MIN_REVIEWS,
    reviewNoun: "critic reviews",
    min: 60,
    max: 100,
    step: 1,
    decimals: 0,
    formatScore: (value) => `${value}%`,
    formatMin: (value) => `${value}%+`,
    scale: "of critics",
    highlyRated: 95,
  },
];

export function getRatingGroup(filterId: RatingFilterId): RatingGroupConfig {
  return RATING_GROUPS.find((group) => group.filterId === filterId)!;
}

/** Rounds to the decimals a score is shown at. */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Whether a film is rated at least `min` on a source. Compared at the
 * precision a score is shown at: a film averaging 3.96 reads "4.0/5" on its
 * poster, and "4.0+" leaving it out would contradict it.
 */
export function meetsRating(
  group: RatingGroupConfig,
  movie: RatingSubject,
  min: number,
): boolean {
  const score = group.read(movie);
  return score !== null && roundTo(score, group.decimals) >= min;
}

/**
 * Builds the filter module for one source: a minimum score, `null` meaning no
 * filter. A film without enough reviews has no score, so any minimum excludes
 * it. Film-level: every showing of a film has the same rating.
 */
function buildRatingFilter(
  group: RatingGroupConfig,
): FilterModule<RatingFilterId> {
  return {
    id: group.filterId,

    getDefault: () => null,

    get: (state: FilterState) => state[group.filterId],

    set: (state: FilterState, value: number | null): FilterState => ({
      ...state,
      [group.filterId]: value,
    }),

    hasActiveFilter: (state: FilterState): boolean =>
      state[group.filterId] !== null,

    toUrlParams: (state: FilterState, params: URLSearchParams) => {
      const value = state[group.filterId];
      if (value === null) return;
      params.set(group.urlParam, value.toFixed(group.decimals));
    },

    // Out-of-range values are clamped rather than rejected: a link asking
    // for 4.7 still means "the very best", which the top of the slider gives.
    fromUrlParams: (params: URLSearchParams) => {
      if (!params.has(group.urlParam)) return undefined;
      const value = Number.parseFloat(params.get(group.urlParam)!);
      if (!Number.isFinite(value)) return null;
      return roundTo(
        Math.min(group.max, Math.max(group.min, value)),
        group.decimals,
      );
    },

    apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
      const min = state[group.filterId];
      if (min === null) return movies;

      const result: MoviesRecord = {};
      for (const [id, movie] of Object.entries(movies)) {
        if (meetsRating(group, movie, min)) result[id] = movie;
      }
      return result;
    },
  };
}

export const letterboxdRatingFilter = buildRatingFilter(RATING_GROUPS[0]);
export const imdbRatingFilter = buildRatingFilter(RATING_GROUPS[1]);
export const rottenTomatoesRatingFilter = buildRatingFilter(RATING_GROUPS[2]);

/**
 * The catalogue at one source's "highly rated" line.
 *
 * - `week` (the home row's "See all"): the catalogue's default week and
 *   categories, which are the row's own.
 * - `all` (a list page's link): every date, as the list page shows every
 *   member showing whenever it is.
 */
export function getHighlyRatedUrl(
  filterId: RatingFilterId,
  range: "week" | "all" = "week",
): string {
  const group = getRatingGroup(filterId);
  const param = `${group.urlParam}=${group.highlyRated.toFixed(group.decimals)}`;
  return range === "all"
    ? `/catalogue?base=all&${param}`
    : `/catalogue?${param}`;
}
