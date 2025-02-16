import {
  type MoviePerformance,
  type Movie,
  type Filters,
  type CinemaData,
  AccessibilityFeature,
} from "@/types";
import getMovieClassification from "./get-movie-classification";
import normalizeString from "./normalize-string";

const matchesAccessibility = (
  performance: MoviePerformance,
  accessibilityFilters: Record<string, boolean>,
) => {
  if (
    accessibilityFilters.none &&
    (!performance.accessibility ||
      Object.keys(performance.accessibility).length === 0)
  ) {
    return true;
  }

  for (const key of Object.keys(accessibilityFilters)) {
    if (
      accessibilityFilters[key] &&
      performance.accessibility?.[key as AccessibilityFeature]
    ) {
      return true;
    }
  }

  return false;
};

const getMatchingMovies = (
  movies: CinemaData["movies"],
  {
    searchTerm,
    dateRange,
    filteredVenues,
    filteredMovies,
    filteredClassifications,
    filteredAccessibilityFeatures,
    filteredGenres,
    yearRange,
    includeUnknownYears,
  }: Filters,
) => {
  const sortedMovies = Object.keys(movies)
    .map((id) => movies[id])
    .sort((a, b) =>
      a.normalizedTitle
        .replace(/[^a-zA-Z0-9]/g, "")
        .localeCompare(b.normalizedTitle.replace(/[^a-zA-Z0-9]/g, "")),
    );

  return sortedMovies.reduce((matchingMovies, movie) => {
    if (
      searchTerm &&
      !normalizeString(movie.title).includes(normalizeString(searchTerm))
    ) {
      return matchingMovies;
    }

    if (!filteredMovies[movie.id]) {
      return matchingMovies;
    }

    if (!filteredClassifications[getMovieClassification(movie)]) {
      return matchingMovies;
    }

    if (
      movie.genres &&
      movie.genres.length > 0 &&
      !movie.genres?.some((genre) => filteredGenres[genre])
    ) {
      return matchingMovies;
    }

    if (movie.year) {
      const year = parseInt(movie.year, 10);
      if (year > yearRange.max || year < yearRange.min) {
        return matchingMovies;
      }
    } else {
      if (!includeUnknownYears) {
        return matchingMovies;
      }
    }

    const performances = movie.performances.reduce(
      (matchingPerformances, performance) => {
        const { venueId } = movie.showings[performance.showingId];
        if (
          // Performances that are in the expected venues
          filteredVenues[venueId] &&
          // Performances that start in the expected time range (in the future)
          performance.time > Math.max(dateRange.start, Date.now()) &&
          performance.time < dateRange.end &&
          matchesAccessibility(performance, filteredAccessibilityFeatures)
        ) {
          matchingPerformances.push(performance);
        }
        return matchingPerformances;
      },
      [] as MoviePerformance[],
    );
    if (performances.length > 0) {
      matchingMovies.push({ ...movie, performances });
    }

    return matchingMovies;
  }, [] as Movie[]);
};

export default getMatchingMovies;
