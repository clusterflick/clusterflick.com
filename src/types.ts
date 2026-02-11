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
  structure: "solo" | "group";
  type: string;
  groupName?: string;
};

export type Person = {
  id: string;
  name: string;
};

export type Genre = {
  id: string;
  name: string;
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

export type MoviePerformance = {
  bookingUrl: string;
  showingId: string;
  time: number;
  notes?: string;
  screen?: string;
  status?: MoviePerformanceStatus;
  accessibility?: MoviePerformanceAccessibility;
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
  isUnmatched?: boolean;
  classification?: Classification;
  overview?: string;
  year?: string;
  releaseDate?: string;
  duration?: number;
  directors?: Person["id"][];
  actors?: Person["id"][];
  genres?: Genre["id"][];
  imdbId?: string;
  youtubeTrailer?: string;
  posterPath?: string;
  /** Included movies for multi-movie events (double features, marathons, etc.) */
  includedMovies?: IncludedMovie[];
  showings: Record<string, Showing>;
  performances: MoviePerformance[];
  imdb?: Imdb;
  letterboxd?: Letterboxd;
  metacritic?: Metacritic;
  rottenTomatoes?: RottenTomatoes;
};

export type CinemaData = {
  filenames: string[];
  generatedAt: string;
  venues: Record<string, Venue>;
  people: Record<string, Person>;
  genres: Record<string, Genre>;
  movies: Record<string, Movie>;
  urlPrefixes: string[];
};

export type MetaData = Omit<CinemaData, "movies"> & {
  mapping: Record<string, string[]>;
};
