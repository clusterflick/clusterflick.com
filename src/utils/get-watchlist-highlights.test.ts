import { describe, it, expect } from "vitest";
import { Category, type Movie } from "@/types";
import { getWatchlistHighlights } from "./get-watchlist-highlights";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

/** A film at one venue, with a performance at each offset (in days). */
function makeMovie(
  id: string,
  days: number[],
  {
    notes,
    soldOut = [],
  }: { notes?: Record<number, string>; soldOut?: number[] } = {},
): Movie {
  return {
    id,
    title: id,
    normalizedTitle: id,
    showings: {
      [id]: {
        id,
        category: Category.Movie,
        url: `https://example.com/${id}`,
        venueId: `venue-${id}`,
      },
    },
    performances: days.map((day, index) => ({
      bookingUrl: `https://example.com/book/${id}-${index}`,
      showingId: id,
      time: NOW + day * DAY,
      notes: notes?.[index],
      ...(soldOut.includes(index) ? { status: { soldOut: true } } : {}),
    })),
  } as Movie;
}

const index = (movies: Movie[]) =>
  Object.fromEntries(movies.map((movie) => [movie.id, movie]));

describe("getWatchlistHighlights", () => {
  it("flags a run whose last bookable showing is within the week", () => {
    const movies = index([
      makeMovie("ending", [1, 3]),
      makeMovie("running", [1, 20]),
    ]);
    const highlights = getWatchlistHighlights(
      movies,
      ["ending", "running"],
      NOW,
    );
    expect(highlights.get("ending")?.finalShowing?.time).toBe(NOW + 3 * DAY);
    expect(highlights.get("running")?.finalShowing).toBeNull();
  });

  it("judges the end by the last showing that isn't sold out", () => {
    const movies = index([makeMovie("film", [1, 20], { soldOut: [1] })]);
    const highlight = getWatchlistHighlights(movies, ["film"], NOW).get("film");
    expect(highlight?.finalShowing?.time).toBe(NOW + DAY);
    expect(highlight?.occasion).toBeNull();
  });

  it("finds an occasion however far out it is", () => {
    const movies = index([
      makeMovie("film", [2, 60], { notes: { 1: "Q&A with the director" } }),
    ]);
    const { occasion } = getWatchlistHighlights(movies, ["film"], NOW).get(
      "film",
    )!;
    expect(occasion?.label).toMatch(/Q&A/);
    expect(occasion?.performance.time).toBe(NOW + 60 * DAY);
  });

  it("skips a sold-out occasion", () => {
    const movies = index([
      makeMovie("film", [2, 30], {
        notes: { 0: "Q&A with the director" },
        soldOut: [0],
      }),
    ]);
    expect(
      getWatchlistHighlights(movies, ["film"], NOW).get("film")?.occasion,
    ).toBeNull();
  });

  it("leaves out films that aren't asked about or aren't showing", () => {
    const movies = index([
      makeMovie("other", [1], { notes: { 0: "Q&A with the director" } }),
    ]);
    const highlights = getWatchlistHighlights(movies, ["departed"], NOW);
    expect(highlights.size).toBe(0);
  });
});
