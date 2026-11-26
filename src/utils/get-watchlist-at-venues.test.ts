import { describe, expect, test } from "vitest";
import type { Movie } from "@clusterflick/catalogue/types";
import {
  formatWatchlistAtVenue,
  getWatchlistAtVenues,
} from "./get-watchlist-at-venues";

const NOW = Date.UTC(2026, 10, 12, 12);
const DAY = 24 * 60 * 60 * 1000;

/** A film from [venue, time, soldOut?] performances, one showing per venue. */
const movie = (...performances: [string, number, boolean?][]) =>
  ({
    showings: Object.fromEntries(
      performances.map(([venueId]) => [venueId, { venueId }]),
    ),
    performances: performances.map(([venueId, time, soldOut]) => ({
      showingId: venueId,
      time,
      ...(soldOut && { status: { soldOut: true } }),
    })),
  }) as unknown as Movie;

describe("getWatchlistAtVenues", () => {
  test("lists each venue's watchlist films, soonest first", () => {
    const movies = {
      a: movie(["rio", NOW + 3 * DAY]),
      b: movie(["rio", NOW + DAY], ["bfi", NOW + 2 * DAY]),
    };
    expect(getWatchlistAtVenues(movies, ["a", "b"], NOW)).toEqual(
      new Map([
        ["rio", ["b", "a"]],
        ["bfi", ["b"]],
      ]),
    );
  });

  test("orders by the film's soonest showing at that venue", () => {
    const movies = {
      a: movie(["rio", NOW + 5 * DAY], ["rio", NOW + DAY]),
      b: movie(["rio", NOW + 2 * DAY]),
    };
    expect(getWatchlistAtVenues(movies, ["b", "a"], NOW).get("rio")).toEqual([
      "a",
      "b",
    ]);
  });

  test("counts only bookable showings in the coming week", () => {
    const movies = {
      past: movie(["rio", NOW - DAY]),
      later: movie(["rio", NOW + 8 * DAY]),
      soldOut: movie(["rio", NOW + DAY, true]),
    };
    expect(
      getWatchlistAtVenues(movies, ["past", "later", "soldOut", "gone"], NOW),
    ).toEqual(new Map());
  });

  test("leaves out films not on the watchlist", () => {
    const movies = { a: movie(["rio", NOW + DAY]) };
    expect(getWatchlistAtVenues(movies, [], NOW)).toEqual(new Map());
  });
});

describe("formatWatchlistAtVenue", () => {
  test("names the first film and counts the rest", () => {
    expect(formatWatchlistAtVenue([])).toBeUndefined();
    expect(formatWatchlistAtVenue(["Paris, Texas"])).toBe("Paris, Texas");
    expect(formatWatchlistAtVenue(["Paris, Texas", "Ran", "Heat"])).toBe(
      "Paris, Texas + 2 more",
    );
  });
});
