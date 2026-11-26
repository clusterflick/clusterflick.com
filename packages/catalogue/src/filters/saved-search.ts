import { FilterId, type FilterState } from "./types";
import {
  buildFilterParams,
  get,
  getDefaultState,
  resolveFilterStateFromUrl,
  set,
} from "./manager";

/**
 * A saved search: a catalogue search kept as its query string, for an email
 * alert to run every night. Shared by the site, which saves one, and the
 * alerts Worker, which reads it, so both leave out the same filters.
 *
 * A saved search is what the reader was looking at, less the filters that
 * only make sense while browsing:
 *
 * - The date range: in the address it is fixed days, so a saved search would
 *   match nothing once they passed. An alert looks at every date ahead.
 * - Hide finished: always on. News is about showings still to come.
 * - Hide sold out: left out. Few venues report it, so it narrows unevenly.
 * - Personal filters (Hide seen) are never in an address to begin with.
 *
 * Everything else is kept as the reader set it, event types included: the
 * query holds only what differs from the catalogue's defaults, and it is read
 * back over those same defaults, so a search on films alone stays on films.
 */

/** The filters a saved search leaves out, whatever the reader set. */
export const UNSAVED_FILTER_IDS: readonly FilterId[] = [
  FilterId.DateRange,
  FilterId.HideFinished,
  FilterId.HideSoldOut,
];

/** `state` with each unsaved filter at its catalogue default. */
function withoutUnsaved(state: FilterState): FilterState {
  const defaults = getDefaultState();
  return UNSAVED_FILTER_IDS.reduce(
    (next, id) => set(next, id, get(defaults, id)),
    state,
  );
}

/**
 * The query string a search is saved as: its filter params, without the
 * unsaved filters and without a leading "?". Empty when nothing is left to
 * search by, which is not a search worth an alert: it would be every listing.
 */
export function toSavedSearchQuery(state: FilterState): string {
  return buildFilterParams(withoutUnsaved(state)).toString();
}

/**
 * Which of the unsaved filters `state` had set, so the page saving it can say
 * what it left out ("Dates aren't saved").
 */
export function getUnsavedFilterIds(state: FilterState): FilterId[] {
  const defaults = getDefaultState();
  return UNSAVED_FILTER_IDS.filter(
    (id) =>
      JSON.stringify(get(state, id)) !== JSON.stringify(get(defaults, id)),
  );
}

/**
 * The filter state a saved query searches with, or null when it holds nothing
 * to search by. Read over the catalogue's defaults, as the query was written;
 * then every date ahead, finished showings hidden, sold-out ones kept. A
 * `base` in the query is ignored, and so is anything else the filters don't
 * read, so a query saved by hand, or by an older version, means the same.
 */
export function readSavedSearch(query: string): FilterState | null {
  const params = new URLSearchParams(query);
  params.delete("base");
  const resolved = resolveFilterStateFromUrl(
    params.toString(),
    getDefaultState(),
  );
  if (!resolved || toSavedSearchQuery(resolved) === "") return null;
  return set(withoutUnsaved(resolved), FilterId.DateRange, {
    start: null,
    end: null,
  });
}
