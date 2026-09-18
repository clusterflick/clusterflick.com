import { FilterId, FilterState, MoviesRecord } from "./types";
import { apply, get, getPermissiveState, set } from "./manager";

/**
 * Most films a grid can show and still be worth telling the reader what the
 * date window is keeping out.
 *
 * The line is only useful while the grid looks like the whole answer but is
 * not, which is while it can be taken in at a glance — under a row of posters.
 *
 * Measured across every person filter in a live release, this limit almost
 * never binds: 71% of them show nothing at all (the suggestion engine's job),
 * 27% show exactly one film, and under 1% show more than three. Raising it to
 * five moves the fire rate from 20% to 21%. What it does do is keep the line
 * off a grid that is genuinely full — an unfiltered `/films` shows 448 films
 * with 1,382 more beyond the window, and a note about those is noise.
 */
export const THIN_RESULT_LIMIT = 3;

export type HiddenByDate = {
  /** Films only the date window is keeping out. */
  count: number;
  /** When the soonest of them is on. */
  from: number;
  /** The state that would reveal them, for the caller to apply. */
  state: FilterState;
};

/**
 * Films the reader's other filters match but the date window excludes — when
 * there are few enough on screen for that to be worth saying.
 *
 * Deliberately not part of `suggestFilterRelaxations`, which exists to rescue a
 * search that returned nothing and is phrased that way throughout. This is the
 * opposite situation: the search worked, and the answer is merely narrower than
 * it looks. It is one probe rather than a pass, it offers one widening rather
 * than ranking many, and it reads as a fact rather than a rescue.
 *
 * Returns null on an empty grid, which belongs to the suggestion engine — it
 * can pair the date with whatever else is wrong, where this only knows dates.
 *
 * @param movies The full dataset
 * @param state The filter state the grid was built from
 * @param shownCount How many films that state returned
 */
export function getHiddenByDate(
  movies: MoviesRecord,
  state: FilterState,
  shownCount: number,
): HiddenByDate | null {
  if (shownCount === 0 || shownCount > THIN_RESULT_LIMIT) return null;

  const permissiveDates = get(getPermissiveState(), FilterId.DateRange);
  const current = get(state, FilterId.DateRange);
  // Already looking at every date, so nothing is being kept out.
  if (
    current.start === permissiveDates.start &&
    current.end === permissiveDates.end
  ) {
    return null;
  }

  const widened = set(state, FilterId.DateRange, permissiveDates);
  const revealed = apply(movies, widened);

  const shown = new Set(Object.keys(apply(movies, state)));
  let count = 0;
  let from = Infinity;
  for (const [id, movie] of Object.entries(revealed)) {
    // A film already on screen is not hidden, even when most of its showings
    // fall outside the window — the reader can see it and click through.
    if (shown.has(id)) continue;
    count += 1;
    for (const performance of movie.performances) {
      if (performance.time < from) from = performance.time;
    }
  }

  if (count === 0 || !Number.isFinite(from)) return null;

  return { count, from, state: widened };
}
