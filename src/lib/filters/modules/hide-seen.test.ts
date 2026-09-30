import { describe, it, expect } from "vitest";
import { Category, type Movie } from "@/types";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import { FilterId, type MoviesRecord } from "../types";
import {
  getDefaultState,
  set,
  get,
  apply,
  hasActiveFilters,
  getRestrictiveFilterIds,
  keepPersonalFilters,
  resolveFilterStateFromUrl,
  buildFilterUrl,
} from "../manager";
import { describeFilters } from "../describe";
import { suggestFilterRelaxations } from "../suggest";

const IN_WINDOW = getLondonMidnightTimestamp() + 2 * MS_PER_DAY;

function makeMovie(id: string, title: string): Movie {
  const showingId = `${id}-s0`;
  return {
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    showings: {
      [showingId]: {
        id: showingId,
        category: Category.Movie,
        url: `https://example.com/${showingId}`,
        venueId: "venue-a",
      },
    },
    performances: [
      {
        bookingUrl: `https://example.com/book/${showingId}`,
        showingId,
        time: IN_WINDOW,
      },
    ],
  } as Movie;
}

const MOVIES: MoviesRecord = {
  "1": makeMovie("1", "Alien"),
  "2": makeMovie("2", "Heat"),
  "3": makeMovie("3", "Paris, Texas"),
};

describe("hideSeenFilter", () => {
  it("drops the seen films and keeps the rest", () => {
    const state = set(getDefaultState(), FilterId.HideSeen, ["1", "3"]);
    expect(Object.keys(apply(MOVIES, state))).toEqual(["2"]);
  });

  it("is off by default", () => {
    expect(get(getDefaultState(), FilterId.HideSeen)).toBeNull();
    expect(Object.keys(apply(MOVIES, getDefaultState()))).toHaveLength(3);
  });

  // Switched on before anything has been marked seen: nothing to hide yet, but
  // the reader's choice still stands.
  it("is active when switched on with nothing seen", () => {
    const state = set(getDefaultState(), FilterId.HideSeen, []);
    expect(Object.keys(apply(MOVIES, state))).toHaveLength(3);
    expect(hasActiveFilters(state)).toBe(true);
    expect(getRestrictiveFilterIds(state)).toContain(FilterId.HideSeen);
  });

  it("is never written to a shared link", () => {
    const state = set(getDefaultState(), FilterId.HideSeen, ["1"]);
    expect(buildFilterUrl(state)).not.toContain("1");
  });

  it("survives following a link, whatever its base", () => {
    const current = set(getDefaultState(), FilterId.HideSeen, ["1"]);
    for (const search of ["?base=all", "?movies=2", "?base=default"]) {
      const state = resolveFilterStateFromUrl(search, current)!;
      expect(get(state, FilterId.HideSeen)).toEqual(["1"]);
    }
  });

  it("is carried across a whole-state replacement", () => {
    const current = set(getDefaultState(), FilterId.HideSeen, ["1"]);
    const next = set(getDefaultState(), FilterId.Search, "heat");
    const kept = keepPersonalFilters(next, current);
    expect(get(kept, FilterId.HideSeen)).toEqual(["1"]);
    expect(get(kept, FilterId.Search)).toBe("heat");
  });

  it("is described as films you haven't seen", () => {
    const state = set(getDefaultState(), FilterId.HideSeen, ["1"]);
    const { events } = describeFilters({
      state: set(state, FilterId.Categories, null),
      categories: [],
      venues: null,
      genres: null,
      cinemaVenueIds: [],
    });
    expect(events).toBe("Events you haven't seen");
  });

  it("is offered as a widening when it hides everything", () => {
    let state = set(getDefaultState(), FilterId.HideSeen, ["2"]);
    state = set(state, FilterId.Search, "heat");
    const [suggestion] = suggestFilterRelaxations({ movies: MOVIES, state });
    expect(suggestion.headline).toBe("Show “Heat”");
    expect(suggestion.changes.map((change) => change.label)).toEqual([
      "Films you've seen shown",
    ]);
  });
});
