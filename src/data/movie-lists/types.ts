import type { Movie } from "@/types";

/**
 * Where a list comes from. Drives attribution wording on the list page and the
 * badge styling on movie pages.
 */
export enum MovieListSource {
  RottenTomatoes = "rotten-tomatoes",
  Letterboxd = "letterboxd",
  Imdb = "imdb",
  /** A publication's hand-picked list (a newspaper, magazine, or critic poll). */
  Editorial = "editorial",
}

/**
 * One film as published in a curated list. Matching prefers `tmdbId`, then
 * `imdbId`, then `rtSlug`, and falls back to title + year — so an entry with
 * only a title and year still works, it is just slightly less certain.
 */
export type MovieListEntry = {
  /** 1-based position in the published list. Omit for unranked lists. */
  rank?: number;
  title: string;
  /**
   * Other titles the film is published or listed under — typically the
   * original-language title for a foreign-language film ("Yi Yi" for "A One and
   * a Two"). Tried alongside `title` when falling back to title matching.
   */
  altTitles?: string[];
  year?: number;
  /** The `rottentomatoes.com/m/<slug>` slug. */
  rtSlug?: string;
  /** A `tt`-style IMDb id. */
  imdbId?: string;
  /**
   * A TMDB id. The surest match there is: the dataset keys its movies by TMDB
   * id, so this resolves by direct lookup rather than any kind of search.
   */
  tmdbId?: string;
};

type MovieListBase = {
  id: string;
  name: string;
  /** Short label for the badge on a movie page, e.g. "RT 300 Best". */
  badgeLabel: string;
  /** Alternative URL slugs that should resolve to this list. */
  aliases: string[];
  source: MovieListSource;
  /** Who published the list, for attribution — e.g. "Rotten Tomatoes". */
  sourceName: string;
  /** The published list itself, always linked so credit points back to it. */
  sourceUrl: string;
  /** One-line summary, used on the index cards and in page metadata. */
  description: string;
  /**
   * How far an entry's year may differ from the dataset's, in years, when
   * falling back to title matching. Defaults to 1.
   *
   * Award lists cite the *award* year, which can trail the film by two — the
   * Academy's International Feature list has `La Strada` (a 1954 film) under
   * 1956. "Best of" lists cite film years, so they stay strict: loosening them
   * across hundreds of entries would invite false matches.
   */
  yearTolerance?: number;
  /**
   * Marker drawn on every poster on this list's page, for lists where being on
   * the list is itself the distinction — an award, rather than a placing. Only
   * used by unranked lists; on a ranked list the position takes the same slot.
   */
  filmBadge?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    /**
     * Distance from the poster's right and bottom edges, in px. Both default
     * to 5. A dense mark (the Fresh tomato) wants more room than a thin
     * silhouette (the palm), and a negative value deliberately bleeds the
     * emblem past the poster edge.
     */
    insetRight?: number;
    insetBottom?: number;
    /** Drop-shadow blur radius, in px. Defaults to 3. */
    shadowBlur?: number;
  };
};

/**
 * A list someone else published, reproduced as membership only. We store the
 * titles and ranks needed to identify the films and always link back to the
 * source — the original write-ups stay on the publisher's site.
 */
export type CuratedMovieList = MovieListBase & {
  kind: "curated";
  entries: MovieListEntry[];
};

/**
 * A list derived from rating data already in the dataset, so it re-evaluates on
 * every build rather than going stale.
 */
export type ComputedMovieList = MovieListBase & {
  kind: "computed";
  /**
   * A movie's score for this list, or `null` if it doesn't qualify. Higher
   * scores sort first.
   */
  score: (movie: Movie) => number | null;
  /** The rule in words, shown on the page so the bar is never a mystery. */
  criteria: string;
};

export type MovieList = CuratedMovieList | ComputedMovieList;

/** Whether a curated list's ranks are meaningful (i.e. it is a countdown). */
export function isRanked(list: MovieList): boolean {
  return list.kind === "curated" && list.entries.some((e) => e.rank != null);
}
