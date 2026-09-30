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
import { getHighlyRatedUrl, meetsLetterboxdRating } from "./letterboxd-rating";

const soon = Date.now() + 86_400_000;

function makeMovie(
  id: string,
  letterboxd?: { rating: number; reviews: number },
): Movie {
  const showingId = `${id}-s`;
  return {
    id,
    title: id,
    normalizedTitle: id,
    ...(letterboxd ? { letterboxd } : {}),
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

const MOVIES: MoviesRecord = {
  great: makeMovie("great", { rating: 4.4, reviews: 50_000 }),
  good: makeMovie("good", { rating: 3.8, reviews: 50_000 }),
  thin: makeMovie("thin", { rating: 4.9, reviews: 300 }),
  unrated: makeMovie("unrated"),
};

const withMin = (min: number | null) =>
  set(getDefaultState(), FilterId.LetterboxdRating, min);

describe("Letterboxd rating filter", () => {
  it("keeps films rated at least the minimum", () => {
    expect(Object.keys(apply(MOVIES, withMin(4)))).toEqual(["great"]);
    expect(Object.keys(apply(MOVIES, withMin(3.5))).sort()).toEqual([
      "good",
      "great",
    ]);
  });

  // Too few reviews means no rating at all, so any threshold leaves it out.
  it("leaves out films without enough reviews to be rated", () => {
    expect(apply(MOVIES, withMin(3))).not.toHaveProperty("thin");
    expect(apply(MOVIES, withMin(3))).not.toHaveProperty("unrated");
  });

  it("is no filter at all when unset", () => {
    expect(Object.keys(apply(MOVIES, withMin(null)))).toHaveLength(4);
  });

  it("compares the rating at the one decimal it is shown at", () => {
    const shownAsFour = makeMovie("x", { rating: 3.96, reviews: 50_000 });
    expect(meetsLetterboxdRating(shownAsFour, 4)).toBe(true);
    const shownAsBelow = makeMovie("y", { rating: 3.94, reviews: 50_000 });
    expect(meetsLetterboxdRating(shownAsBelow, 4)).toBe(false);
  });
});

describe("Letterboxd rating URL param", () => {
  it("round-trips through a shared link at one decimal place", () => {
    const url = new URL(buildFilterUrl(withMin(3.8)), "https://example.com");
    expect(url.searchParams.get("letterboxd")).toBe("3.8");
    expect(
      resolveFilterStateFromUrl(url.search, getDefaultState())?.[
        FilterId.LetterboxdRating
      ],
    ).toBe(3.8);
  });

  it("clamps to the slider's range and rounds to its step", () => {
    const read = (value: string) =>
      resolveFilterStateFromUrl(`?letterboxd=${value}`, getDefaultState())?.[
        FilterId.LetterboxdRating
      ];
    expect(read("4.9")).toBe(4.5);
    expect(read("1")).toBe(3);
    expect(read("3.96")).toBe(4);
    expect(read("high")).toBeNull();
  });

  // The row's "See all" sits on the catalogue defaults, which are the row's
  // own week and categories.
  it("links the Highly Rated row at its threshold, on the default base", () => {
    const link = getHighlyRatedUrl();
    expect(link).toBe("/catalogue?letterboxd=4.0");
    const state = resolveFilterStateFromUrl(
      link.slice(link.indexOf("?")),
      getDefaultState(),
    );
    expect(state?.[FilterId.LetterboxdRating]).toBe(4);
    expect(state?.[FilterId.Categories]).toEqual(
      getDefaultState()[FilterId.Categories],
    );
  });
});
