import { describe, it, expect } from "vitest";
import { Category, type Movie } from "@/types";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import { FilterId, type MoviesRecord } from "../types";
import {
  getDefaultState,
  set,
  apply,
  hasActiveFilters,
  getRestrictiveFilterIds,
  sanitizeFilterState,
  resolveFilterStateFromUrl,
  buildFilterUrl,
} from "../manager";
import { getMovieVocabulary, getMoviesFilterUrl } from "./movies";

const IN_WINDOW = getLondonMidnightTimestamp() + 2 * MS_PER_DAY;

function makeMovie(
  id: string,
  title: string,
  performances = 1,
  year?: string,
): Movie {
  const showingId = `${id}-s0`;
  return {
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    ...(year ? { year } : {}),
    showings: {
      [showingId]: {
        id: showingId,
        category: Category.Movie,
        url: `https://example.com/${showingId}`,
        venueId: "venue-a",
      },
    },
    performances: Array.from({ length: performances }, (_, index) => ({
      bookingUrl: `https://example.com/book/${showingId}/${index}`,
      showingId,
      time: IN_WINDOW + index,
    })),
  } as Movie;
}

const MOVIES: MoviesRecord = {
  "1": makeMovie("1", "Alien", 3, "1979"),
  "2": makeMovie("2", "Heat", 1, "1995"),
  "3": makeMovie("3", "Paris, Texas", 5, "1984"),
};

describe("moviesFilter", () => {
  it("keeps only the selected films", () => {
    const state = set(getDefaultState(), FilterId.Movies, ["1", "3"]);
    expect(Object.keys(apply(MOVIES, state)).sort()).toEqual(["1", "3"]);
  });

  // A film off today can be back tomorrow, so its id matches nothing rather
  // than being an error, and the films that are showing still come through.
  it("ignores ids the dataset doesn't hold", () => {
    const state = set(getDefaultState(), FilterId.Movies, ["2", "gone"]);
    expect(Object.keys(apply(MOVIES, state))).toEqual(["2"]);
  });

  it("treats an empty selection as no filter", () => {
    const state = set(getDefaultState(), FilterId.Movies, []);
    expect(Object.keys(apply(MOVIES, state))).toHaveLength(3);
    expect(hasActiveFilters(state)).toBe(false);
  });

  it("reports itself restrictive while selecting", () => {
    const state = set(getDefaultState(), FilterId.Movies, ["1"]);
    expect(getRestrictiveFilterIds(state)).toContain(FilterId.Movies);
  });

  // Session storage is how the selection follows the reader between pages.
  it("survives sanitising with unknown ids intact", () => {
    const state = set(getDefaultState(), FilterId.Movies, ["1", "gone"]);
    const restored = sanitizeFilterState(JSON.parse(JSON.stringify(state)));
    expect(restored.movies).toEqual(["1", "gone"]);
  });

  describe("url params", () => {
    it("round-trips through a shared link", () => {
      const state = set(getDefaultState(), FilterId.Movies, ["1", "gone"]);
      const url = buildFilterUrl(state);
      const resolved = resolveFilterStateFromUrl(
        url.slice(url.indexOf("?")),
        getDefaultState(),
      )!;
      expect(resolved.movies).toEqual(["1", "gone"]);
    });

    it("normalises an empty param to no filter", () => {
      const resolved = resolveFilterStateFromUrl(
        "?base=all&movies=",
        getDefaultState(),
      )!;
      expect(resolved.movies).toBeNull();
    });

    it("drops duplicate ids", () => {
      const resolved = resolveFilterStateFromUrl(
        "?movies=1,1,2",
        getDefaultState(),
      )!;
      expect(resolved.movies).toEqual(["1", "2"]);
    });
  });
});

describe("getMoviesFilterUrl", () => {
  it("opens every date and category, keeping the ids readable", () => {
    expect(getMoviesFilterUrl("/planner", ["1", "gone"])).toBe(
      "/planner?base=all&movies=1,gone",
    );
  });

  it("resolves to exactly the ids it was given", () => {
    const url = getMoviesFilterUrl("/catalogue", ["1", "a b"]);
    const resolved = resolveFilterStateFromUrl(
      url.slice(url.indexOf("?")),
      getDefaultState(),
    )!;
    expect(resolved.movies).toEqual(["1", "a b"]);
    expect(resolved.dateRange).toEqual({ start: null, end: null });
    expect(resolved.categories).toBeNull();
  });
});

describe("getMovieVocabulary", () => {
  it("orders by performances and names each film with its year", () => {
    expect(getMovieVocabulary(MOVIES)).toEqual([
      { id: "3", name: "Paris, Texas (1984)", count: 5 },
      { id: "1", name: "Alien (1979)", count: 3 },
      { id: "2", name: "Heat (1995)", count: 1 },
    ]);
  });
});
