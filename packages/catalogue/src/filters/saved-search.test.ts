import { describe, expect, it } from "vitest";
import { AccessibilityFeature, Category } from "../types";
import { FilterId, type FilterState } from "./types";
import { get, getDefaultState, set } from "./manager";
import {
  getUnsavedFilterIds,
  readSavedSearch,
  toSavedSearchQuery,
} from "./saved-search";

const DAY = 86_400_000;

/** The catalogue's defaults with these filters set, as the overlay sets them. */
function search(
  ...changes: [FilterId, FilterState[keyof FilterState]][]
): FilterState {
  return changes.reduce(
    (state, [id, value]) => set(state, id, value as never),
    getDefaultState(),
  );
}

const atRio = search([FilterId.Venues, ["rio"]]);

describe("toSavedSearchQuery", () => {
  it("is the search's filter params", () => {
    const query = toSavedSearchQuery(
      search(
        [FilterId.Venues, ["rio"]],
        [FilterId.Accessibility, [AccessibilityFeature.AudioDescription]],
      ),
    );
    const params = new URLSearchParams(query);
    expect(params.get("venues")).toBe("rio");
    expect(params.get("accessibility")).toBe("audioDescription");
  });

  it("leaves out the dates, hide finished and hide sold out", () => {
    const start = getDefaultState()[FilterId.DateRange].start!;
    const query = toSavedSearchQuery(
      search(
        [FilterId.Venues, ["rio"]],
        [FilterId.DateRange, { start: start + DAY, end: start + 3 * DAY }],
        [FilterId.HideFinished, false],
        [FilterId.HideSoldOut, true],
      ),
    );
    expect(query).toBe(toSavedSearchQuery(atRio));
  });

  it("is empty when nothing is left to search by", () => {
    expect(toSavedSearchQuery(getDefaultState())).toBe("");
    expect(
      toSavedSearchQuery(
        search([FilterId.DateRange, { start: null, end: null }]),
      ),
    ).toBe("");
  });

  it("never writes a personal filter", () => {
    expect(toSavedSearchQuery(search([FilterId.HideSeen, ["m1", "m2"]]))).toBe(
      "",
    );
  });
});

describe("readSavedSearch", () => {
  it("reads back the search, on every date ahead, finished showings hidden", () => {
    const state = readSavedSearch(toSavedSearchQuery(atRio))!;
    expect(get(state, FilterId.Venues)).toEqual(["rio"]);
    expect(get(state, FilterId.DateRange)).toEqual({ start: null, end: null });
    expect(get(state, FilterId.HideFinished)).toBe(true);
    expect(get(state, FilterId.HideSoldOut)).toBe(false);
  });

  // The query holds only what differs from the defaults, so it must be read
  // over the defaults: over `base=all` a search left on films would widen to
  // every event.
  it("keeps the event types the reader saw", () => {
    expect(
      get(readSavedSearch(toSavedSearchQuery(atRio))!, FilterId.Categories),
    ).toEqual(get(getDefaultState(), FilterId.Categories));

    const everything = search(
      [FilterId.Venues, ["rio"]],
      [FilterId.Categories, null],
    );
    expect(
      get(
        readSavedSearch(toSavedSearchQuery(everything))!,
        FilterId.Categories,
      ),
    ).toBeNull();

    const quizzes = search([FilterId.Categories, [Category.Quiz]]);
    expect(
      get(readSavedSearch(toSavedSearchQuery(quizzes))!, FilterId.Categories),
    ).toEqual([Category.Quiz]);
  });

  it("is the same search saved again", () => {
    const query = toSavedSearchQuery(
      search([FilterId.Venues, ["rio", "pcc"]], [FilterId.Directors, ["1032"]]),
    );
    expect(toSavedSearchQuery(readSavedSearch(query)!)).toBe(query);
  });

  it("ignores a base, and anything the filters don't read", () => {
    const query = toSavedSearchQuery(atRio);
    expect(readSavedSearch(`base=all&${query}&utm_source=email`)).toEqual(
      readSavedSearch(query),
    );
  });

  it("ignores dates and hide filters saved by hand", () => {
    const query = toSavedSearchQuery(atRio);
    const state = readSavedSearch(
      `${query}&dateStart=2026-12-01&dateEnd=2026-12-02&hideSoldOut=true`,
    )!;
    expect(get(state, FilterId.DateRange)).toEqual({ start: null, end: null });
    expect(get(state, FilterId.HideSoldOut)).toBe(false);
  });

  it("is null when there's nothing to search by", () => {
    expect(readSavedSearch("")).toBeNull();
    expect(readSavedSearch("base=all")).toBeNull();
    expect(readSavedSearch("utm_source=email")).toBeNull();
    expect(readSavedSearch("dateStart=2026-12-01")).toBeNull();
  });
});

describe("getUnsavedFilterIds", () => {
  it("names what the reader set that a saved search leaves out", () => {
    const start = getDefaultState()[FilterId.DateRange].start!;
    expect(
      getUnsavedFilterIds(
        search(
          [FilterId.Venues, ["rio"]],
          [FilterId.DateRange, { start, end: start + DAY }],
          [FilterId.HideSoldOut, true],
        ),
      ),
    ).toEqual([FilterId.DateRange, FilterId.HideSoldOut]);
  });

  it("is empty at the defaults", () => {
    expect(getUnsavedFilterIds(atRio)).toEqual([]);
  });
});
