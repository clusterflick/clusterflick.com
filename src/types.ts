import type { SocialHandles } from "@/utils/build-social-links";

export type Position = {
  lat: number;
  lon: number;
};

export type Venue = {
  id: string;
  name: string;
  url: string;
  address: string;
  geo: Position;
  /** Venue's own handles, as published in the combined release. */
  socials: SocialHandles;
  structure: "solo" | "group";
  type: string;
  /**
   * What the entry represents, which is what drives the cinemas and small
   * screenings venue presets. Deliberately separate from `type`: `type`
   * describes the place, `programming` describes how film gets on there, so a
   * venue can be retyped for accuracy without silently moving between presets.
   *
   * - `cinema` — a programmed cinema operation, whoever owns the building
   * - `venue`  — a substantial programmed venue that isn't a cinema
   * - `host`   — a place that incidentally hosts screenings
   */
  programming: "cinema" | "venue" | "host";
  groupName?: string;
  /**
   * The latest performance the venue registry has ever seen here, which for an
   * active venue is its furthest-out listing rather than a past date. Absent
   * for a venue that has never had a screening while the registry has been
   * watching — not the same as one that has gone quiet.
   */
  lastPerformance?: number;
};

export type Person = {
  id: string;
  name: string;
};

export type Genre = {
  id: string;
  name: string;
};

/** One film in a TMDB collection, whether or not it is currently screening. */
export type CollectionPart = {
  id: string;
  title: string;
  releaseDate: string;
  posterPath?: string;
};

/**
 * A TMDB movie collection (a franchise or series) with at least one film
 * screening in London. Only the naming fields reach the client — the full
 * record, including `parts`, is read at build time from
 * `public/data/collections.json`. See `CollectionSummary`.
 */
export type Collection = {
  id: string;
  name: string;
  slug: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  parts: CollectionPart[];
};

/** The slice of a collection carried in the meta blob every visitor downloads. */
export type CollectionSummary = {
  id: string;
  name: string;
  slug: string;
  posterPath?: string;
  partCount: number;
};

export enum Category {
  Movie = "movie",
  MultipleMovies = "multiple-movies",
  Tv = "tv",
  Quiz = "quiz",
  Comedy = "comedy",
  Music = "music",
  Talk = "talk",
  Workshop = "workshop",
  Shorts = "shorts",
  Event = "event",
}

export type IncludedMovie = {
  id: string;
  title: string;
  posterPath?: string;
  year?: string;
  duration?: number;
  genres?: Genre["id"][];
  directors?: Person["id"][];
  actors?: Person["id"][];
  imdbId?: string;
  overview?: string;
  normalizedTitle?: string;
  releaseDate?: string;
  collectionId?: Collection["id"];
};

export type Showing = {
  id: string;
  title?: string;
  seen?: number;
  category: Category;
  url: string;
  venueId: string;
  includedMovies?: IncludedMovie[];
};

type MoviePerformanceStatus = {
  soldOut?: boolean;
};

export enum AccessibilityFeature {
  AudioDescription = "audioDescription",
  BabyFriendly = "babyFriendly",
  HardOfHearing = "hardOfHearing",
  Relaxed = "relaxed",
  Subtitled = "subtitled",
}

/**
 * Sentinel value representing "no accessibility features".
 * Used in the accessibility filter to include performances
 * that don't have any accessibility features set.
 */
export const ACCESSIBILITY_NONE = "none" as const;

/**
 * Union type for accessibility filter values.
 * Includes all real features plus the "none" sentinel.
 */
export type AccessibilityFilterValue =
  | AccessibilityFeature
  | typeof ACCESSIBILITY_NONE;

type MoviePerformanceAccessibility = Partial<
  Record<AccessibilityFeature, boolean>
>;

/**
 * Physical/technical format of a performance. Each field is only present when
 * the performance is something other than the default — an absent field means
 * the default (Digital source, Normal presentation, 2D dimension).
 */
export enum FormatSource {
  Digital = "digital",
  SeventyMm = "70mm",
  // A 15/70 (horizontal) IMAX print — a different film geometry from a standard
  // 5/70 70mm print, so it is its own source rather than a 70mm variant. The
  // "IMAX" here names the print, not the screen; presentation still records that.
  ImaxSeventyMm = "imax-70mm",
  ThirtyFiveMm = "35mm",
  SixteenMm = "16mm",
  Vhs = "vhs",
  Laserdisc = "laserdisc",
  Nitrate = "nitrate",
}

export enum FormatPresentation {
  Imax = "imax",
  FourDx = "4dx",
  ScreenX = "screenx",
  DolbyCinema = "dolby-cinema",
}

export enum FormatDimension {
  TwoD = "2d",
  ThreeD = "3d",
}

export const FormatSourceDefault = FormatSource.Digital;

export const FormatDimensionDefault = FormatDimension.TwoD;

export type MoviePerformanceFormat = {
  source?: FormatSource;
  presentation?: FormatPresentation;
  dimension?: FormatDimension;
};

export type MoviePerformance = {
  bookingUrl: string;
  showingId: string;
  time: number;
  notes?: string;
  screen?: string;
  status?: MoviePerformanceStatus;
  accessibility?: MoviePerformanceAccessibility;
  format?: MoviePerformanceFormat;
};

export enum Classification {
  Universal = "U",
  ParentalGuidance = "PG",
  Suitablefor12years = "12",
  Suitablefor12yearsAccompanied = "12A",
  Suitablefor15years = "15",
  Suitablefor18years = "18",
  Unknown = "Unknown",
}
export const classificationOrder: Classification[] = [
  Classification.Universal,
  Classification.ParentalGuidance,
  Classification.Suitablefor12years,
  Classification.Suitablefor12yearsAccompanied,
  Classification.Suitablefor15years,
  Classification.Suitablefor18years,
  Classification.Unknown,
];

/**
 * A film's entry on bechdeltest.com, joined on IMDB id.
 *
 * `rating` counts how many of the three criteria the film meets, so it is a
 * 0-3 tally rather than a score — `passes` is the only meaningful reading of
 * it. `dubious` marks a verdict the site itself considers disputed, and is
 * independent of the rating: a film can pass all three and still be dubious.
 *
 * Coverage is partial and skews old — the list is crowd-sourced and lags badly
 * on new releases — so an absent entry means "not rated", never "fails".
 */
type Bechdel = {
  id: number;
  url: string;
  rating: 0 | 1 | 2 | 3;
  passes: boolean;
  dubious: boolean;
};

type Imdb = {
  id: string;
  url: string;
  rating: number | null;
  reviews: number;
  unweightedRating: number | null;
};

type Letterboxd = {
  id: string;
  url: string;
  likes: number;
  reviews: number;
  rating?: number | null;
  unweightedRating?: number | null;
};

type MovieDb = {
  id: string;
  url: string;
  rating: number;
  reviews: number;
};

type MetacriticScore = {
  dislikes?: number | null;
  likes?: number | null;
  rating?: number | null;
  reviews?: number | null;
};

type Metacritic = {
  id: string;
  url: string;
  audience: MetacriticScore;
  critics: MetacriticScore;
};

type RottenTomatoesScore = {
  dislikes?: number;
  likes?: number;
  reviews: number;
  rating?: number | null;
  score?: number | null;
};

type RottenTomatoes = {
  id: string;
  url: string;
  audience: {
    all: RottenTomatoesScore | undefined;
    verified: RottenTomatoesScore | undefined;
  };
  critics: {
    all: RottenTomatoesScore | undefined;
    top: RottenTomatoesScore | undefined;
  };
};

export type Movie = {
  id: string;
  title: string;
  normalizedTitle: string;
  /** The title in its original language, when that isn't English and differs from `title`. */
  originalTitle?: string;
  /** ISO 639-1 code of the film's original language, when that isn't English. */
  originalLanguage?: string;
  isUnmatched?: boolean;
  classification?: Classification;
  overview?: string;
  year?: string;
  releaseDate?: string;
  duration?: number;
  directors?: Person["id"][];
  actors?: Person["id"][];
  genres?: Genre["id"][];
  /** The TMDB collection this film belongs to, when that collection has a page. */
  collectionId?: Collection["id"];
  imdbId?: string;
  youtubeTrailer?: string;
  posterPath?: string;
  /** Included movies for multi-movie events (double features, marathons, etc.) */
  includedMovies?: IncludedMovie[];
  showings: Record<string, Showing>;
  performances: MoviePerformance[];
  bechdel?: Bechdel;
  imdb?: Imdb;
  letterboxd?: Letterboxd;
  metacritic?: Metacritic;
  moviedb?: MovieDb;
  rottenTomatoes?: RottenTomatoes;
};

export type CinemaData = {
  filenames: string[];
  generatedAt: string;
  venues: Record<string, Venue>;
  people: Record<string, Person>;
  genres: Record<string, Genre>;
  collections: Record<string, CollectionSummary>;
  movies: Record<string, Movie>;
  urlPrefixes: string[];
};

export type MetaData = Omit<CinemaData, "movies"> & {
  mapping: Record<string, string[]>;
};

/**
 * A single pipeline run's changes, as published by `clusterflick/data-diffed`.
 * One release per run; the updates feed reads a window of them.
 *
 * Only the fields the site uses are typed here — the blob also carries removals
 * and TMDB match changes, which the feed deliberately ignores.
 */
export type DiffShowing = {
  showingId: string;
  title: string;
  url: string;
  category: Category;
  seen?: number;
  themoviedb?: DiffMovieMatch;
  themoviedbs?: DiffMovieMatch[];
  /** Present on added showings only: future performance times, ascending. */
  performances?: number[];
  futurePerformanceCount: number;
  nextPerformance: number | null;
};

export type DiffMovieMatch = {
  id: number;
  title: string;
  releaseDate: string;
};

export type DiffModifiedShowing = {
  showingId: string;
  title: string;
  url: string;
  category: Category;
  themoviedb?: DiffMovieMatch;
  themoviedbs?: DiffMovieMatch[];
  performances: {
    previousCount: number;
    currentCount: number;
    /** Newly scheduled performance times. */
    added: number[];
    removed: number[];
    rescheduled: number;
  };
};

export type DiffVenue = {
  name: string | null;
  venueAdded: boolean;
  venueRemoved: boolean;
  venueEmpty: boolean;
  showings: {
    added: DiffShowing[];
    removed: DiffShowing[];
    modified: DiffModifiedShowing[];
  };
};

export type DiffBlob = {
  metadata: {
    currentRelease: string;
    previousRelease: string;
    /** When the compared release was published — what the diff is anchored to. */
    asOf: string;
    venueCount: number;
  };
  venues: Record<string, DiffVenue>;
};
