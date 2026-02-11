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
 * - Returns the most common category from showings
 * - Deprioritizes "event" if other categories exist
 */
export function getPrimaryCategory(movie: Movie): Category {
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
    const categories = state.categories;
    // Active if not the default selection
    if (!categories) return categories === null; // null = all selected (active); undefined = missing (inactive)
    if (categories.length !== DEFAULT_CATEGORIES.length) return true;
    return !DEFAULT_CATEGORIES.every((c) => categories.includes(c));
  },

  toUrlParams: (state: FilterState, params: URLSearchParams) => {
    const categories = state.categories;
    if (categories) {
      params.set("categories", categories.join(","));
    }
  },

  fromUrlParams: (params: URLSearchParams) => {
    if (params.has("categories")) {
      const values = params
        .get("categories")!
        .split(",")
        .map((v) => v.trim())
        .filter((v) =>
          Object.values(Category).includes(v as Category),
        ) as Category[];
      return values;
    }
    return undefined;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const categories = state.categories;

    // null/undefined = no filter, include all
    if (!categories) {
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
