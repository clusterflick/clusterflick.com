import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/**
 * Hide seen films filter module.
 * - `null` = show every film (default)
 * - `string[]` = hide these films: the ids on the reader's Seen list
 *
 * The state holds the ids themselves rather than a flag, because the pipeline
 * is a pure function of the dataset and the state: it runs in suggestion
 * probes, the thin-result notice and the overlay's counts, none of which can
 * reach the user context. A flag would also leave every memoised result keyed
 * on the state blind to a film being marked seen. `SeenFilterSync` keeps the
 * ids equal to the Seen list while the toggle is on, and clears them on sign
 * out.
 *
 * It is personal: the ids are never written to a URL, and whole-state
 * replacements other than a reset (a shared link, a quick filter) carry it
 * across rather than switching it off — see `keepPersonalFilters`.
 */
export const hideSeenFilter: FilterModule<FilterId.HideSeen> = {
  id: FilterId.HideSeen,

  personal: true,

  getDefault: () => null,

  get: (state: FilterState) => state[FilterId.HideSeen],

  set: (state: FilterState, value: string[] | null): FilterState => ({
    ...state,
    [FilterId.HideSeen]: value,
  }),

  // On even with nothing seen yet: the reader asked for it, and the overlay's
  // switch reads its state from here.
  hasActiveFilter: (state: FilterState): boolean =>
    state[FilterId.HideSeen] !== null,

  apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
    const seen = state[FilterId.HideSeen];
    if (!seen || seen.length === 0) return movies;

    const seenSet = new Set(seen);
    const result: MoviesRecord = {};
    for (const [id, movie] of Object.entries(movies)) {
      if (!seenSet.has(id)) result[id] = movie;
    }
    return result;
  },

  // Personal: a link is for someone else, whose Seen list isn't this one.
  toUrlParams: () => {},

  fromUrlParams: () => undefined,
};
