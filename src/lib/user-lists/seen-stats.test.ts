import { describe, expect, it } from "vitest";
import type { UserListEntry } from "./index";
import type { FilmDetailsData } from "./film-details";
import { getSeenStats } from "./seen-stats";

const entry = (title: string, year?: string): UserListEntry => ({
  title,
  ...(year && { year }),
  addedAt: 0,
});

const genreNames = { "18": "Drama", "80": "Crime", "878": "Science Fiction" };

const seen = {
  "949": entry("Heat", "1995"),
  "603": entry("The Matrix", "1999"),
  "19": entry("Metropolis", "1927"),
  "1001": entry("Insider", "1999"),
  a1b2c3d4: entry("A Shorts Night", "2026"),
};

const details: FilmDetailsData = {
  films: {
    "949": {
      genres: ["80", "18"],
      directors: ["1"],
      cast: ["2", "3"],
      runtime: 170,
      language: "en",
    },
    "603": {
      genres: ["878"],
      directors: ["4"],
      cast: ["5"],
      runtime: 136,
      language: "en",
    },
    "19": {
      genres: ["878", "18"],
      directors: ["6"],
      cast: [],
      runtime: 153,
      language: "de",
    },
    "1001": {
      genres: ["18"],
      directors: ["1"],
      cast: ["2"],
      runtime: 157,
      language: "en",
    },
    // On no list any more: ignored.
    "11": {
      genres: ["18"],
      directors: ["1"],
      cast: ["2"],
      runtime: 999,
      language: "fr",
    },
  },
  people: {
    "1": "Michael Mann",
    "2": "Al Pacino",
    "3": "Robert De Niro",
    "4": "Lana Wachowski",
    "5": "Keanu Reeves",
    "6": "Fritz Lang",
  },
};

describe("getSeenStats", () => {
  const stats = getSeenStats(seen, details, genreNames);

  it("counts every film, and which have details", () => {
    expect(stats.films).toBe(5);
    expect(stats.withDetails).toBe(4);
    expect(stats.directors).toBe(3);
  });

  it("adds up the running time, and what it comes to", () => {
    // 170 + 136 + 153 + 157 minutes.
    expect(stats.hours).toBe(10);
    expect(stats.days).toBe(0);
    expect(stats.doubleBills).toBe(3);
  });

  it("finds the records, years from the list itself", () => {
    expect(stats.records.longest?.id).toBe("949");
    expect(stats.records.longest?.runtime).toBe(170);
    expect(stats.records.shortest?.id).toBe("603");
    expect(stats.records.oldest?.id).toBe("19");
    // The unmatched film has no details but does have a year.
    expect(stats.records.newest?.id).toBe("a1b2c3d4");
  });

  it("ranks only people with more than one film", () => {
    expect(stats.topDirectors).toEqual([
      { id: "1", name: "Michael Mann", count: 2 },
    ]);
    expect(stats.topCast).toEqual([{ id: "2", name: "Al Pacino", count: 2 }]);
  });

  it("counts genres by name, most first", () => {
    expect(stats.genres).toEqual([
      { id: "18", name: "Drama", count: 3 },
      { id: "878", name: "Science Fiction", count: 2 },
      { id: "80", name: "Crime", count: 1 },
    ]);
  });

  it("counts languages, most first", () => {
    expect(stats.languages).toEqual([
      { code: "en", count: 3 },
      { code: "de", count: 1 },
    ]);
  });

  it("lists every decade between the oldest and newest, gaps included", () => {
    expect(stats.decades.map(({ decade }) => decade)).toEqual([
      1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020,
    ]);
    expect(stats.decades.find(({ decade }) => decade === 1990)?.count).toBe(3);
    expect(stats.decades.find(({ decade }) => decade === 1950)?.count).toBe(0);
  });

  it("copes with an empty list", () => {
    const empty = getSeenStats({}, { films: {}, people: {} }, genreNames);
    expect(empty.films).toBe(0);
    expect(empty.records).toEqual({
      longest: undefined,
      shortest: undefined,
      oldest: undefined,
      newest: undefined,
    });
    expect(empty.decades).toEqual([]);
  });
});
