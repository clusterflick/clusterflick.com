import {
  type MoviePerformance,
  type Movie,
  type Filters,
  type CinemaData,
  type AccessibilityFeature,
} from "@/types";
import { getHours, isWithinInterval } from "date-fns";
import getMovieClassification from "./get-movie-classification";
import normalizeString from "./normalize-string";
import { getMovieCategory } from "./gete-movie-category";

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

const simplifySorting = (value: string) =>
  value
    .trim()
    .replace(/^the /i, "")
    .replace(/[^a-zA-Z0-9]/g, "");

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
    seenRange,
    filteredCategories,
    filteredAudienceRatings,
    filteredCriticsRatings,
    filteredPerformanceTimes,
  }: Filters,
  defaultFilters?: Filters,
) => {
  const sortedMovies = Object.keys(movies)
    .map((id) => movies[id])
    .sort((a, b) =>
      simplifySorting(a.title).localeCompare(simplifySorting(b.title)),
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

    const category = getMovieCategory(movie);
    if (!filteredCategories[category]) {
      return matchingMovies;
    }

    const audienceRating = movie.rottenTomatoes?.audience.all?.rating;
    if (audienceRating) {
      const key = audienceRating.split(".")[0];
      if (!filteredAudienceRatings[key]) {
        return matchingMovies;
      }
    } else {
      if (!filteredAudienceRatings["none"]) {
        return matchingMovies;
      }
    }

    const criticsRating = movie.rottenTomatoes?.critics.all?.rating;
    if (criticsRating) {
      const key = criticsRating.split(".")[0];
      if (!filteredCriticsRatings[key]) {
        return matchingMovies;
      }
    } else {
      if (!filteredCriticsRatings["none"]) {
        return matchingMovies;
      }
    }

    const performances = movie.performances.reduce(
      (matchingPerformances, performance) => {
        // Default showings without a seen date to the oldest value
        const { venueId, seen = defaultFilters!.seenRange.start } =
          movie.showings[performance.showingId];
        if (
          // Performances that are in the expected venues
          filteredVenues[venueId] &&
          // Performances that are in the expected seen range
          isWithinInterval(seen, seenRange) &&
          // Performances that start in the expected date range (in the future)
          performance.time > Math.max(dateRange.start, Date.now()) &&
          performance.time < dateRange.end &&
          // Performances that start in the expected times slots
          filteredPerformanceTimes[getHours(performance.time)] &&
          // Performances with matching accessibiliy features
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
