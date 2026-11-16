import { describe, it, expect } from "vitest";
import type { Movie } from "../types";
import { getIncludedListings } from "./get-included-listings";

const film = (overrides: Partial<Movie>): Movie => ({
  id: "1",
  title: "Film",
  normalizedTitle: "film",
  showings: {},
  performances: [],
  ...overrides,
});

describe("getIncludedListings", () => {
  const tenenbaums = film({ id: "9428", title: "The Royal Tenenbaums" });
  const doubleBill = film({
    id: "dfe14ea2",
    title: "Double Bill: Fantastic Mr. Fox and The Royal Tenenbaums",
    includedMovies: [
      { id: "10315", title: "Fantastic Mr. Fox" },
      { id: "9428", title: "The Royal Tenenbaums" },
    ],
  });
  const movies = Object.fromEntries(
    [tenenbaums, doubleBill].map((movie) => [movie.id, movie]),
  );

  it("pairs each film the event screens with its own listing, by id", () => {
    expect(getIncludedListings(doubleBill, movies)).toEqual([
      { film: { id: "10315", title: "Fantastic Mr. Fox" } },
      {
        film: { id: "9428", title: "The Royal Tenenbaums" },
        listing: tenenbaums,
      },
    ]);
  });

  it("does not need the film to share an IMDb id with its listing", () => {
    // Matching used to go through `imdbId`, which left a film without one
    // looking as if it had no listing of its own.
    const listed = getIncludedListings(doubleBill, movies);
    expect(listed[1].listing).toBe(tenenbaums);
    expect(tenenbaums.imdbId).toBeUndefined();
  });

  it("does not offer an event as the listing of a film it is matched to", () => {
    const introduced = film({
      id: "9428",
      title: "The Royal Tenenbaums + Intro",
      includedMovies: [{ id: "9428", title: "The Royal Tenenbaums" }],
    });
    expect(getIncludedListings(introduced, { "9428": introduced })).toEqual([
      { film: { id: "9428", title: "The Royal Tenenbaums" } },
    ]);
  });

  it("is empty for a listing that screens nothing else", () => {
    expect(getIncludedListings(tenenbaums, movies)).toEqual([]);
  });
});
