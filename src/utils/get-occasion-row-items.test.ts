import { describe, it, expect } from "vitest";
import type { Movie } from "@/types";
import type { ScoredMovie } from "./get-discovery-movies";
import { getOccasionRowItems } from "./get-occasion-row-items";

// Sunday 8 November 2026, 19:30 in London (GMT).
const TIME = Date.UTC(2026, 10, 8, 19, 30);

const movie = (partial: Partial<Movie>) =>
  ({ id: "m", title: "Ran", posterPath: "/ran.jpg", ...partial }) as Movie;

const scored = (partial: Partial<ScoredMovie>): ScoredMovie => ({
  movie: movie({}),
  performanceCount: 1,
  occasion: { label: "Live score", time: TIME, venueId: "v1" },
  ...partial,
});

const venues = { v1: { name: "The Chiswick Cinema" } };
const href = (m: Movie) => `/movies/${m.id}`;

describe("getOccasionRowItems", () => {
  it("leads with the occasion and names the day, time and venue", () => {
    expect(getOccasionRowItems([scored({})], venues, href)).toEqual([
      {
        id: "m",
        href: "/movies/m",
        title: "Ran",
        posterPath: "/ran.jpg",
        occasion: "Live score",
        when: "Sun 8 Nov, 19:30",
        venue: "The Chiswick Cinema",
      },
    ]);
  });

  it("links wherever the page asks", () => {
    const [item] = getOccasionRowItems(
      [scored({})],
      venues,
      (m) => `/movies/${m.id}?venues=v1`,
    );
    expect(item.href).toBe("/movies/m?venues=v1");
  });

  it("borrows a poster from an included film when the event has none", () => {
    const [item] = getOccasionRowItems(
      [
        scored({
          movie: movie({
            posterPath: undefined,
            includedMovies: [
              { title: "A" },
              { title: "B", posterPath: "/b.jpg" },
            ] as Movie["includedMovies"],
          }),
        }),
      ],
      venues,
      href,
    );
    expect(item.posterPath).toBe("/b.jpg");
  });

  it("leaves out a film with no occasion, and names no unknown venue", () => {
    const items = getOccasionRowItems(
      [
        scored({ occasion: undefined }),
        scored({
          movie: movie({ id: "n" }),
          occasion: { label: "Q&A", time: TIME, venueId: "gone" },
        }),
      ],
      venues,
      href,
    );
    expect(items.map((i) => [i.id, i.venue])).toEqual([["n", null]]);
  });
});
