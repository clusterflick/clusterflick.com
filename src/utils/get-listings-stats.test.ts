import { describe, it, expect } from "vitest";
import {
  Category,
  FormatSource,
  type CinemaData,
  type Movie,
  type MoviePerformance,
} from "@/types";
import { getListingsStats } from "./get-listings-stats";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

function makeMovie(
  id: string,
  category: Category,
  performances: { day: number; venue: string; source?: FormatSource }[],
): Movie {
  const showings = Object.fromEntries(
    [...new Set(performances.map((p) => p.venue))].map((venue) => [
      `${id}-${venue}`,
      { id: `${id}-${venue}`, category, url: "", venueId: venue },
    ]),
  );
  return {
    id,
    title: id,
    normalizedTitle: id,
    showings,
    performances: performances.map(
      ({ day, venue, source }): MoviePerformance => ({
        bookingUrl: "",
        showingId: `${id}-${venue}`,
        time: NOW + day * DAY,
        ...(source ? { format: { source } } : {}),
      }),
    ),
  } as unknown as Movie;
}

const data = {
  venues: { a: {}, b: {}, c: {}, d: {} },
  movies: {
    film: makeMovie("film", Category.Movie, [
      { day: 1, venue: "a" },
      { day: 2, venue: "b", source: FormatSource.ThirtyFiveMm },
      { day: 2.5, venue: "b", source: FormatSource.ThirtyFiveMm },
      // Outside the week, and in the past.
      { day: 9, venue: "c" },
      { day: -1, venue: "c" },
    ]),
    shorts: makeMovie("shorts", Category.Shorts, [{ day: 3, venue: "a" }]),
    // Not one of the catalogue's default categories.
    quiz: makeMovie("quiz", Category.Quiz, [{ day: 1, venue: "d" }]),
    later: makeMovie("later", Category.Movie, [{ day: 8, venue: "d" }]),
  },
} as unknown as CinemaData;

describe("getListingsStats", () => {
  it("counts the coming week over the catalogue's default categories", () => {
    expect(getListingsStats(data, NOW)).toEqual({
      films: 2,
      screenings: 4,
      venues: 2,
      venuesTracked: 4,
      thirtyFiveMm: { screenings: 2, films: 1 },
    });
  });
});
