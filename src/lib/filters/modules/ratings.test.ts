import { describe, it, expect } from "vitest";
import { Category, type Movie } from "@/types";
import { FilterId, type MoviesRecord } from "../types";
import {
  apply,
  getDefaultState,
  resolveFilterStateFromUrl,
  set,
  buildFilterUrl,
} from "../manager";
import {
  getHighlyRatedUrl,
  getRatingGroup,
  meetsRating,
  type RatingFilterId,
} from "./ratings";

const soon = Date.now() + 86_400_000;

function makeMovie(id: string, scores: Record<string, unknown> = {}): Movie {
  const showingId = `${id}-s`;
  return {
    id,
    title: id,
    normalizedTitle: id,
    ...scores,
    showings: {
      [showingId]: {
        id: showingId,
        category: Category.Movie,
        url: `https://example.com/${id}`,
        venueId: "venue-a",
      },
    },
    performances: [
      { showingId, bookingUrl: `https://example.com/book/${id}`, time: soon },
    ],
  } as Movie;
}

const lb = (rating: number, reviews = 50_000) => ({
  letterboxd: { rating, reviews },
});
const imdb = (rating: number, reviews = 50_000) => ({
  imdb: { rating, reviews },
});
const rt = (score: number, reviews = 100) => ({
  rottenTomatoes: { critics: { all: { score, reviews } } },
});

const MOVIES: MoviesRecord = {
  great: makeMovie("great", { ...lb(4.4), ...imdb(8.6), ...rt(98) }),
  good: makeMovie("good", { ...lb(3.8), ...imdb(7.4), ...rt(88) }),
  thin: makeMovie("thin", {
    ...lb(4.9, 300),
    ...imdb(9.1, 900),
    ...rt(100, 12),
  }),
  unrated: makeMovie("unrated"),
} as MoviesRecord;

const withMin = (filterId: RatingFilterId, min: number | null) =>
  set(getDefaultState(), filterId, min);

describe.each([
  [FilterId.LetterboxdRating, 4, 3.5],
  [FilterId.ImdbRating, 8, 7],
  [FilterId.RottenTomatoesRating, 95, 85],
] as const)("%s filter", (filterId, high, low) => {
  it("keeps films rated at least the minimum", () => {
    expect(Object.keys(apply(MOVIES, withMin(filterId, high)))).toEqual([
      "great",
    ]);
    expect(Object.keys(apply(MOVIES, withMin(filterId, low))).sort()).toEqual([
      "good",
      "great",
    ]);
  });

  // Too few reviews means no score at all, so any threshold leaves it out.
  it("leaves out films without enough reviews to be rated", () => {
    const result = apply(
      MOVIES,
      withMin(filterId, getRatingGroup(filterId).min),
    );
    expect(result).not.toHaveProperty("thin");
    expect(result).not.toHaveProperty("unrated");
  });

  it("is no filter at all when unset", () => {
    expect(Object.keys(apply(MOVIES, withMin(filterId, null)))).toHaveLength(4);
  });
});

describe("rating filters together", () => {
  it("narrow with each other, as every other pair of filters does", () => {
    const state = set(
      withMin(FilterId.LetterboxdRating, 3.5),
      FilterId.RottenTomatoesRating,
      95,
    );
    expect(Object.keys(apply(MOVIES, state))).toEqual(["great"]);
  });
});

describe("meetsRating", () => {
  it("compares a score at the precision it is shown at", () => {
    const letterboxd = getRatingGroup(FilterId.LetterboxdRating);
    expect(meetsRating(letterboxd, makeMovie("x", lb(3.96)), 4)).toBe(true);
    expect(meetsRating(letterboxd, makeMovie("y", lb(3.94)), 4)).toBe(false);
  });
});

describe("rating URL params", () => {
  it("round-trip through a shared link at the precision they are shown at", () => {
    let state = withMin(FilterId.LetterboxdRating, 3.8);
    state = set(state, FilterId.ImdbRating, 7.5);
    state = set(state, FilterId.RottenTomatoesRating, 92);
    const url = new URL(buildFilterUrl(state), "https://example.com");
    expect(url.searchParams.get("letterboxd")).toBe("3.8");
    expect(url.searchParams.get("imdb")).toBe("7.5");
    expect(url.searchParams.get("rottenTomatoes")).toBe("92");

    const resolved = resolveFilterStateFromUrl(url.search, getDefaultState());
    expect(resolved?.[FilterId.LetterboxdRating]).toBe(3.8);
    expect(resolved?.[FilterId.ImdbRating]).toBe(7.5);
    expect(resolved?.[FilterId.RottenTomatoesRating]).toBe(92);
  });

  it("clamp to each slider's range and round to its step", () => {
    const read = (query: string, filterId: RatingFilterId) =>
      resolveFilterStateFromUrl(query, getDefaultState())?.[filterId];
    expect(read("?letterboxd=4.9", FilterId.LetterboxdRating)).toBe(4.5);
    expect(read("?letterboxd=3.96", FilterId.LetterboxdRating)).toBe(4);
    expect(read("?imdb=2", FilterId.ImdbRating)).toBe(6);
    expect(read("?rottenTomatoes=94.6", FilterId.RottenTomatoesRating)).toBe(
      95,
    );
    expect(read("?rottenTomatoes=high", FilterId.RottenTomatoesRating)).toBe(
      null,
    );
  });
});

describe("getHighlyRatedUrl", () => {
  it("sets each source at its highly rated line", () => {
    expect(getHighlyRatedUrl(FilterId.LetterboxdRating)).toBe(
      "/catalogue?letterboxd=4.0",
    );
    expect(getHighlyRatedUrl(FilterId.ImdbRating, "all")).toBe(
      "/catalogue?base=all&imdb=8.0",
    );
    expect(getHighlyRatedUrl(FilterId.RottenTomatoesRating, "all")).toBe(
      "/catalogue?base=all&rottenTomatoes=95",
    );
  });

  // The home row's link sits on the catalogue defaults, which are the row's
  // own week and categories; a list page's covers every date, as it does.
  it("keeps the default week for the home row, and drops it for lists", () => {
    const week = resolveFilterStateFromUrl(
      "?letterboxd=4.0",
      getDefaultState(),
    );
    expect(week?.[FilterId.DateRange]).toEqual(
      getDefaultState()[FilterId.DateRange],
    );
    const all = resolveFilterStateFromUrl(
      "?base=all&imdb=8.0",
      getDefaultState(),
    );
    expect(all?.[FilterId.DateRange]).toEqual({ start: null, end: null });
  });
});
