import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MetaData, Movie } from "../types";
import { readListings } from "./read-listings";

// 15 November 2026, 10:00 in London (GMT).
const NOW = Date.UTC(2026, 10, 15, 10);
const TODAY = Date.UTC(2026, 10, 15);
const HOUR = 3_600_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

/** A meta file and a chunk as the site's build publishes them: no ids. */
function published() {
  const meta = {
    formatVersion: 1,
    generatedAt: "2026-11-15T06:00:00Z",
    filenames: ["data.0.aaaaaaaaaa.json"],
    mapping: { "0": ["m1", "m2", "m3"] },
    genres: { "18": { name: "Drama" } },
    people: { p1: { name: "Agnès Varda" } },
    venues: { v1: { name: "Venue" } },
    collections: { c1: { name: "Collection" } },
  } as unknown as MetaData;
  const chunk = {
    m1: {
      title: "Earlier Today",
      genres: ["18"],
      showings: { s1: { venueId: "v1" } },
      performances: [{ showingId: "s1", time: TODAY + HOUR }],
    },
    m2: {
      title: "Yesterday Only",
      genres: ["18"],
      showings: { s2: { venueId: "v1" } },
      performances: [{ showingId: "s2", time: TODAY - HOUR }],
    },
    m3: {
      title: "No Genre",
      showings: {
        s3: { venueId: "v1" },
        s4: { venueId: "v1" },
      },
      performances: [
        { showingId: "s3", time: TODAY - HOUR },
        { showingId: "s4", time: TODAY + 30 * HOUR },
      ],
    },
  } as unknown as Record<string, Movie>;
  return { meta, chunk };
}

describe("readListings", () => {
  it("restores every record's id from its key", () => {
    const { meta, chunk } = published();
    const listings = readListings(meta, [chunk]);
    expect(listings.genres["18"].id).toBe("18");
    expect(listings.people.p1.id).toBe("p1");
    expect(listings.venues.v1.id).toBe("v1");
    expect(listings.collections.c1.id).toBe("c1");
    expect(listings.movies.m1.id).toBe("m1");
    expect(listings.movies.m1.showings.s1.id).toBe("s1");
  });

  it("keeps today's performances, even those already past, and drops earlier days'", () => {
    const { meta, chunk } = published();
    const { movies } = readListings(meta, [chunk]);
    expect(Object.keys(movies).sort()).toEqual(["m1", "m3"]);
    expect(Object.keys(movies.m3.showings)).toEqual(["s4"]);
    expect(movies.m3.performances.map(({ showingId }) => showingId)).toEqual([
      "s4",
    ]);
  });

  it("files a film without a genre under Uncategorised", () => {
    const { meta, chunk } = published();
    const listings = readListings(meta, [chunk]);
    expect(listings.genres.uncategorised).toEqual({
      id: "uncategorised",
      name: "Uncategorised",
    });
    expect(listings.movies.m3.genres).toEqual(["uncategorised"]);
    expect(listings.movies.m1.genres).toEqual(["18"]);
  });

  it("combines the chunks", () => {
    const { meta, chunk } = published();
    const { m1, ...rest } = chunk;
    const { movies } = readListings(meta, [rest, { m1 }]);
    expect(Object.keys(movies).sort()).toEqual(["m1", "m3"]);
  });
});
