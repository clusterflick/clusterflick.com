import { describe, it, expect } from "vitest";
import type { Movie } from "../types";
import { getContainingEvents } from "./get-containing-events";

const film = (overrides: Partial<Movie>): Movie => ({
  id: "1",
  title: "Film",
  normalizedTitle: "film",
  showings: {},
  performances: [],
  ...overrides,
});

describe("getContainingEvents", () => {
  const totoro = film({ id: "8392", title: "My Neighbor Totoro" });
  const allNighter = film({
    id: "ghibli",
    title: "Studio Ghibli All-Nighter",
    includedMovies: [
      { id: "8392", title: "My Neighbor Totoro" },
      { id: "129", title: "Spirited Away" },
    ],
  });
  const doubleBill = film({
    id: "horror",
    title: "Horror Double Bill",
    includedMovies: [{ id: "948", title: "Halloween" }],
  });
  const movies = Object.fromEntries(
    [totoro, allNighter, doubleBill].map((movie) => [movie.id, movie]),
  );

  it("finds the events that screen the film, by id", () => {
    expect(getContainingEvents("8392", movies)).toEqual([allNighter]);
  });

  it("finds nothing for a film no event screens", () => {
    expect(getContainingEvents("129129", movies)).toEqual([]);
  });

  it("never lists an event as containing itself", () => {
    const self = film({
      id: "8392",
      includedMovies: [{ id: "8392", title: "My Neighbor Totoro" }],
    });
    expect(getContainingEvents("8392", { "8392": self })).toEqual([]);
  });
});
