import { describe, expect, test } from "vitest";
import type { SeenStats } from "@/lib/user-lists/seen-stats";
import { getTasteLine } from "./taste";

function stats(overrides: Partial<SeenStats> = {}): SeenStats {
  return {
    films: 10,
    withDetails: 10,
    hours: 20,
    directors: 8,
    languages: [],
    records: {},
    topDirectors: [],
    topCast: [],
    genres: [],
    decades: [],
    ...overrides,
  };
}

describe("getTasteLine", () => {
  test("names the genres, decade and director that stand out", () => {
    expect(
      getTasteLine(
        stats({
          genres: [
            { id: "18", name: "Drama", count: 6 },
            { id: "80", name: "Crime", count: 5 },
            { id: "35", name: "Comedy", count: 1 },
          ],
          decades: [
            { decade: 1980, count: 2 },
            { decade: 1990, count: 6 },
            { decade: 2000, count: 2 },
          ],
          topDirectors: [{ id: "1", name: "Wong Kar-wai", count: 4 }],
        }),
      ),
    ).toBe("Mostly drama and crime · Big on the 1990s · 4 Wong Kar-wai films");
  });

  test("names one genre when the next is well behind", () => {
    expect(
      getTasteLine(
        stats({
          genres: [
            { id: "27", name: "Horror", count: 6 },
            { id: "53", name: "Thriller", count: 3 },
          ],
        }),
      ),
    ).toBe("Mostly horror");
  });

  test("lowercases a genre of two words", () => {
    expect(
      getTasteLine(
        stats({ genres: [{ id: "878", name: "Science Fiction", count: 5 }] }),
      ),
    ).toBe("Mostly science fiction");
  });

  test("leaves out what isn't true enough to say", () => {
    expect(
      getTasteLine(
        stats({
          genres: [{ id: "18", name: "Drama", count: 2 }],
          decades: [
            { decade: 1990, count: 3 },
            { decade: 2000, count: 3 },
            { decade: 2010, count: 2 },
            { decade: 2020, count: 2 },
          ],
        }),
      ),
    ).toBeNull();
  });
});
