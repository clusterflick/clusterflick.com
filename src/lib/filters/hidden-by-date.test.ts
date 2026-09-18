import { describe, it, expect } from "vitest";
import { Category, type Movie, type MoviePerformance } from "@/types";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import { FilterId, type MoviesRecord } from "./types";
import { getDefaultState, getPermissiveState, set } from "./manager";
import { getHiddenByDate, THIN_RESULT_LIMIT } from "./hidden-by-date";

const TODAY = getLondonMidnightTimestamp();
const IN_WINDOW = TODAY + 2 * MS_PER_DAY;
const BEYOND = TODAY + 30 * MS_PER_DAY;
const FURTHER = TODAY + 60 * MS_PER_DAY;

function makeMovie(id: string, title: string, times: number[]): Movie {
  const showingId = `${id}-s0`;
  const performances: MoviePerformance[] = times.map((time) => ({
    bookingUrl: `https://example.com/book/${showingId}`,
    showingId,
    time,
  }));
  return {
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    actors: ["a1"],
    showings: {
      [showingId]: {
        id: showingId,
        category: Category.Movie,
        url: `https://example.com/${showingId}`,
        venueId: "venue-a",
      },
    },
    performances,
  } as Movie;
}

const movies = (...specs: [string, string, number[]][]): MoviesRecord =>
  Object.fromEntries(
    specs.map(([id, t, times]) => [id, makeMovie(id, t, times)]),
  );

/** The state a reader lands in from the "Show films starring X" offer. */
const withCast = () => set(getDefaultState(), FilterId.Cast, ["a1"]);

describe("getHiddenByDate", () => {
  // The case this exists for: one film this week, a trilogy later in the year.
  it("counts films only the date window is keeping out", () => {
    const data = movies(
      ["1", "The Wild Robot", [IN_WINDOW]],
      ["2", "Star Wars", [BEYOND]],
      ["3", "The Empire Strikes Back", [FURTHER]],
    );
    const result = getHiddenByDate(data, withCast(), 1);
    expect(result?.count).toBe(2);
    expect(result?.from).toBe(BEYOND);
  });

  it("hands back a state that reveals them", () => {
    const data = movies(["1", "A", [IN_WINDOW]], ["2", "B", [BEYOND]]);
    const result = getHiddenByDate(data, withCast(), 1);
    expect(result?.state[FilterId.DateRange]).toEqual(
      getPermissiveState()[FilterId.DateRange],
    );
    // Everything else the reader chose is left alone.
    expect(result?.state[FilterId.Cast]).toEqual(["a1"]);
  });

  it("says nothing when the window is hiding nothing", () => {
    const data = movies(["1", "A", [IN_WINDOW]], ["2", "B", [IN_WINDOW]]);
    expect(getHiddenByDate(data, withCast(), 2)).toBeNull();
  });

  // A film on screen is not hidden, however many of its showings fall outside —
  // the reader can see it and click through to the rest.
  it("does not count a film already shown with later showings too", () => {
    const data = movies(["1", "A", [IN_WINDOW, BEYOND, FURTHER]]);
    expect(getHiddenByDate(data, withCast(), 1)).toBeNull();
  });

  describe("when it stays quiet", () => {
    it("says nothing on an empty grid, which belongs to the suggestions", () => {
      const data = movies(["1", "A", [BEYOND]]);
      expect(getHiddenByDate(data, withCast(), 0)).toBeNull();
    });

    it("says nothing once the grid is long enough to be a real answer", () => {
      const data = movies(
        ["1", "A", [IN_WINDOW]],
        ["2", "B", [IN_WINDOW]],
        ["3", "C", [IN_WINDOW]],
        ["4", "D", [IN_WINDOW]],
        ["5", "E", [BEYOND]],
      );
      expect(
        getHiddenByDate(data, withCast(), THIN_RESULT_LIMIT + 1),
      ).toBeNull();
    });

    it("says nothing when the reader is already looking at every date", () => {
      const data = movies(["1", "A", [IN_WINDOW]], ["2", "B", [BEYOND]]);
      const allDates = set(
        withCast(),
        FilterId.DateRange,
        getPermissiveState()[FilterId.DateRange],
      );
      expect(getHiddenByDate(data, allDates, 2)).toBeNull();
    });
  });
});
