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
};

type Person = {
  id: string;
  name: string;
};

export type Genre = {
  id: string;
  name: string;
};

type Overview = {
  actors: string[];
  categories: string[];
  directors: string[];
  classification: string;
  duration: number;
  year: string;
};

export type Showing = {
  id: string;
  title?: string;
  seen?: number;
  overview: Overview;
  url: string;
  venueId: string;
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

type RottenTomatoesScore = {
  dislikes: number;
  likes: number;
  reviews: number;
  rating?: string;
  score?: string;
};

type RottenTomatoes = {
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
  showings: Record<string, Showing>;
  performances: MoviePerformance[];
  rottenTomatoes?: RottenTomatoes;
};

export type CinemaData = {
  generatedAt: string;
  venues: Record<string, Venue>;
  people: Record<string, Person>;
  genres: Record<string, Genre>;
  movies: Record<string, Movie>;
};

export type DateRange = {
  start: number;
  end: number;
};

export type YearRange = {
  min: number;
  max: number;
};

export type Filters = {
  searchTerm: string;
  dateRange: DateRange;
  yearRange: YearRange;
  includeUnknownYears: boolean;
  seenRange: DateRange;
  filteredAudienceRatings: Record<string, boolean>;
  filteredCriticsRatings: Record<string, boolean>;
  filteredPerformanceTimes: Record<string, boolean>;
  filteredVenues: Record<Venue["id"], boolean>;
  filteredMovies: Record<Movie["id"], boolean>;
  filteredClassifications: Record<Classification, boolean>;
  filteredGenres: Record<Genre["id"], boolean>;
  filteredAccessibilityFeatures: Record<AccessibilityFeature, boolean>;
};

export type FavouriteMovie = {
  id: string;
  title: string;
  year?: string;
  addedOn: number;
};
