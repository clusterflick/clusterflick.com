import { Category, Movie } from "@/types";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/**
 * Default categories: Films, Multiple Films, Short Films
 */
const DEFAULT_CATEGORIES: Category[] = [
  Category.Movie,
  Category.MultipleMovies,
  Category.Shorts,
];

/**
 * Determines the primary category for a movie.
 * - If the movie has includedMovies, it's a multiple-movies event
 * - Otherwise, returns the most common category from showings
 * - Deprioritizes "event" if other categories exist
 */
export function getPrimaryCategory(movie: Movie): Category {
  // If the movie has included movies, it's a multiple-movies event
  if (movie.includedMovies && movie.includedMovies.length > 0) {
    return Category.MultipleMovies;
  }

  const showings = Object.values(movie.showings);
  if (showings.length === 0) {
    return Category.Event; // Fallback
  }

  // Count occurrences of each category
  const categoryCounts = new Map<Category, number>();
  for (const showing of showings) {
    const count = categoryCounts.get(showing.category) || 0;
    categoryCounts.set(showing.category, count + 1);
  }

  // Sort categories by count (descending)
  const sortedCategories = [...categoryCounts.entries()].sort(
    ([, a], [, b]) => b - a,
  );

  // If the top category is "event" and there are other options, use the next most popular
  if (
    sortedCategories[0][0] === Category.Event &&
    sortedCategories.length > 1
  ) {
    return sortedCategories[1][0];
  }

  return sortedCategories[0][0];
}

/**
 * Categories filter module.
 * Filters movies by their primary category (most common across showings).
 * - `null` = no filter (all categories included)
 * - `[]` = no categories selected (no movies match)
 * - Default: Films, Multiple Films, Short Films
 */
export const categoriesFilter: FilterModule<FilterId.Categories> = {
  id: FilterId.Categories,

  getDefault: () => [...DEFAULT_CATEGORIES],

  get: (state: FilterState) => state.categories,

  set: (state: FilterState, value: Category[] | null): FilterState => ({
    ...state,
    categories: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    // Active if not the default selection
    if (state.categories === null) return true; // All selected is different from default
    if (state.categories.length !== DEFAULT_CATEGORIES.length) return true;
    return !DEFAULT_CATEGORIES.every((c) => state.categories!.includes(c));
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const categories = state.categories;

    // null = no filter, include all
    if (categories === null) {
      return movies;
    }

    // Empty array = none selected, no movies match
    if (categories.length === 0) {
      return {};
    }

    const categorySet = new Set(categories);
    const result: MoviesRecord = {};

    for (const [id, movie] of Object.entries(movies)) {
      // Filter based on the movie's primary category
      const primaryCategory = getPrimaryCategory(movie);
      if (categorySet.has(primaryCategory)) {
        result[id] = movie;
      }
    }

    return result;
  },
};
