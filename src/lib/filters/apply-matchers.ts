import { FilterId, type FilterState, type MoviesRecord } from "./types";
import { apply, getPermissiveState } from "./manager";

const cache = new WeakMap<
  MoviesRecord,
  WeakMap<Partial<FilterState>[], MoviesRecord>
>();

/**
 * Runs a set of OR'd matchers (a film club's or festival's) over the dataset,
 * returning the movies they identify with only their matching showings and
 * performances, and finished performances pruned.
 *
 * The union has to be taken per movie rather than per movie *id*, because every
 * matcher returns a movie pruned to what that matcher matched. A film matching
 * two matchers therefore arrives twice, each copy carrying a different slice of
 * the same film — so keeping the last one silently discards the rest. The
 * Japanese Film Club matches "Shall We Dance?" by showing title at the Phoenix,
 * which lists it as "Japanese Film Club: Shall We Dance?" and hands booking to
 * the club, and by performance note at Regent Street and Ciné Lumière, which the
 * club's own source supplies; assigning dropped whichever venue came first.
 *
 * Performances are unioned by identity: every filter narrows with `filter`, so a
 * performance that survives is the object the dataset holds, and rebuilding from
 * the original preserves its ordering as well as its contents.
 *
 * Results are memoised per dataset and matcher set. Every movie, venue and
 * borough page asks which festivals and clubs it belongs to, and each answer
 * used to run every registered club's and festival's matchers over the whole
 * dataset again. Callers get a shared record and must not mutate it.
 */
export function applyMatchers(
  matchers: Partial<FilterState>[],
  movies: MoviesRecord,
): MoviesRecord {
  let byMatchers = cache.get(movies);
  if (!byMatchers) {
    byMatchers = new WeakMap();
    cache.set(movies, byMatchers);
  }

  let result = byMatchers.get(matchers);
  if (!result) {
    result = computeMatches(matchers, movies);
    byMatchers.set(matchers, result);
  }
  return result;
}

function computeMatches(
  matchers: Partial<FilterState>[],
  movies: MoviesRecord,
): MoviesRecord {
  const matchedShowings = new Map<string, MoviesRecord[string]["showings"]>();
  const matchedPerformances = new Map<
    string,
    Set<MoviesRecord[string]["performances"][number]>
  >();

  for (const matcher of matchers) {
    const state: FilterState = {
      ...getPermissiveState(),
      ...matcher,
      [FilterId.HideFinished]: true,
    };

    for (const [id, movie] of Object.entries(apply(movies, state))) {
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
