import type { FilterState, MoviesRecord } from "./types";

type Matchers = Partial<FilterState>[];

/** Runs one matcher over the given movies, as the full filter pipeline. */
export type MatcherRunner = (
  movies: MoviesRecord,
  matcher: Partial<FilterState>,
) => MoviesRecord;

/** Returns the movies any of the given matchers identify. */
export type MatchAny = (
  matchers: Matchers,
  movies: MoviesRecord,
) => MoviesRecord;

/**
 * Builds the function that runs a set of OR'd matchers (a film club's or
 * festival's) over a set of movies, returning the movies they identify with
 * only their matching showings and performances.
 *
 * The runner is injected rather than imported because the runner is the filter
 * pipeline itself, and the pipeline's film club and festival modules are built
 * on this — importing the manager here would make the two modules import each
 * other.
 *
 * Nothing is pruned by time. Pages that list what is still to come
 * (`applyMatchers`) do that themselves; inside the pipeline, finished showings
 * are the reader's hide-finished setting to decide.
 *
 * Results are memoised per input record and matcher array. Every movie, venue
 * and borough page asks which clubs and festivals it belongs to, and the films
 * grid re-runs its pipeline on every keystroke; both hand in the same dataset
 * and the same registry arrays each time. Callers get a shared record and must
 * not mutate it.
 */
export function createMatchAny(run: MatcherRunner): MatchAny {
  const cache = new WeakMap<MoviesRecord, WeakMap<Matchers, MoviesRecord>>();

  return (matchers, movies) => {
    let byMatchers = cache.get(movies);
    if (!byMatchers) {
      byMatchers = new WeakMap();
      cache.set(movies, byMatchers);
    }

    let result = byMatchers.get(matchers);
    if (!result) {
      result = unionMatches(
        matchers.map((matcher) => run(movies, matcher)),
        movies,
      );
      byMatchers.set(matchers, result);
    }
    return result;
  };
}

/**
 * Unions several pruned slices of the same movies, per movie.
 *
 * The union has to be taken per movie rather than per movie *id*, because each
 * slice holds a movie pruned to what produced it. A film in two slices
 * therefore arrives twice, each copy carrying a different part of the same
 * film — so keeping the last one silently discards the rest. The Japanese Film
 * Club matches "Shall We Dance?" by showing title at the Phoenix, which lists
 * it as "Japanese Film Club: Shall We Dance?" and hands booking to the club,
 * and by performance note at Regent Street and Ciné Lumière, which the club's
 * own source supplies; assigning dropped whichever venue came first.
 *
 * Performances are unioned by identity: every filter narrows with `filter`, so
 * a performance that survives is the object `movies` holds, and rebuilding from
 * it preserves its ordering as well as its contents. Every slice must therefore
 * have been cut from `movies`.
 */
export function unionMatches(
  slices: MoviesRecord[],
  movies: MoviesRecord,
): MoviesRecord {
  const matchedShowings = new Map<string, MoviesRecord[string]["showings"]>();
  const matchedPerformances = new Map<
    string,
    Set<MoviesRecord[string]["performances"][number]>
  >();

  for (const slice of slices) {
    for (const [id, movie] of Object.entries(slice)) {
      matchedShowings.set(id, {
        ...matchedShowings.get(id),
        ...movie.showings,
      });
      const performances = matchedPerformances.get(id) ?? new Set();
      for (const performance of movie.performances)
        performances.add(performance);
      matchedPerformances.set(id, performances);
    }
  }

  const result: MoviesRecord = {};

  for (const [id, showings] of matchedShowings) {
    const performances = matchedPerformances.get(id)!;
    result[id] = {
      ...movies[id],
      showings,
      performances: movies[id].performances.filter((performance) =>
        performances.has(performance),
      ),
    };
  }

  return result;
}
