import { Movie, MoviePerformance, Showing } from "@/types";

/**
 * Filter performances across all movies using the given predicate,
 * prune orphaned showings, and drop movies with no remaining performances.
 */
export function pruneByPerformances(
  movies: Record<string, Movie>,
  predicate: (perf: MoviePerformance) => boolean,
): Record<string, Movie> {
  const result: Record<string, Movie> = {};

  for (const [id, movie] of Object.entries(movies)) {
    const filteredPerformances = movie.performances.filter(predicate);

    if (filteredPerformances.length === 0) {
      continue;
    }

    const remainingShowingIds = new Set(
      filteredPerformances.map((p) => p.showingId),
    );
    const filteredShowings: typeof movie.showings = {};
    for (const [showingId, showing] of Object.entries(movie.showings)) {
      if (remainingShowingIds.has(showingId)) {
        filteredShowings[showingId] = showing;
      }
    }

    result[id] = {
      ...movie,
      performances: filteredPerformances,
      showings: filteredShowings,
    };
  }

  return result;
}

/**
 * Filter showings across all movies using the given predicate,
 * prune orphaned performances, and drop movies with no remaining
 * showings or performances.
 */
export function pruneByShowings(
  movies: Record<string, Movie>,
  predicate: (showing: Showing, showingId: string) => boolean,
): Record<string, Movie> {
  const result: Record<string, Movie> = {};

  for (const [id, movie] of Object.entries(movies)) {
    const filteredShowings: typeof movie.showings = {};
    for (const [showingId, showing] of Object.entries(movie.showings)) {
      if (predicate(showing, showingId)) {
        filteredShowings[showingId] = showing;
      }
    }

    if (Object.keys(filteredShowings).length === 0) {
      continue;
    }

    const validShowingIds = new Set(Object.keys(filteredShowings));
    const filteredPerformances: MoviePerformance[] = movie.performances.filter(
      (perf) => validShowingIds.has(perf.showingId),
    );

    if (filteredPerformances.length === 0) {
      continue;
    }

    result[id] = {
      ...movie,
      showings: filteredShowings,
      performances: filteredPerformances,
    };
  }

  return result;
}
