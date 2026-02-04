import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/**
 * Genres filter module.
 * Filters movies by genre IDs.
 * - `null` = all genres selected (no filter applied)
 * - `[]` = no genres selected (no movies match)
 * - `[...ids]` = only movies with at least one of these genres
 */
export const genresFilter: FilterModule<FilterId.Genres> = {
  id: FilterId.Genres,

  getDefault: () => null,

  get: (state: FilterState) => state.genres,

  set: (state: FilterState, value: string[] | null): FilterState => ({
    ...state,
    genres: value,
  }),

  hasActiveFilter: (state: FilterState): boolean => {
    // Active if explicitly filtering (not all selected)
    return state.genres !== null;
  },

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const genres = state.genres;

    // null = no filter, include all
    if (genres === null) {
      return movies;
    }

    // Empty array = none selected, no movies match
    if (genres.length === 0) {
      return {};
    }

    const genreSet = new Set(genres);
    const result: MoviesRecord = {};

    for (const [id, movie] of Object.entries(movies)) {
      // Check if movie has any of the selected genres
      const movieGenres = movie.genres ?? [];
      const hasMatchingGenre = movieGenres.some((genreId) =>
        genreSet.has(genreId),
      );

      if (hasMatchingGenre) {
        result[id] = movie;
      }
    }

    return result;
  },
};
