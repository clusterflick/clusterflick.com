import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  findEntryObjects,
  insertTmdbIds,
  normaliseTitle,
  pickListMatch,
} from "./movie-list-tmdb-ids";
import { MOVIE_LISTS } from "@/data/movie-lists";
import { LIST_FILES } from "../add-movie-list-tmdb-ids.config.mjs";

const result = (id, title, date, originalTitle) => ({
  id,
  title,
  original_title: originalTitle ?? title,
  release_date: date,
});

describe("normaliseTitle", () => {
  it("folds case, accents, punctuation and ampersands", () => {
    expect(normaliseTitle("Amélie")).toBe("amelie");
    expect(normaliseTitle("Lock, Stock & Two Smoking Barrels")).toBe(
      normaliseTitle("Lock Stock and Two Smoking Barrels"),
    );
  });
});

describe("pickListMatch", () => {
  it("matches the title within the year tolerance", () => {
    expect(
      pickListMatch({ title: "Heat", year: 1995 }, [
        result(1, "Heat", "1986-03-14"),
        result(949, "Heat", "1995-12-15"),
      ]),
    ).toEqual({ status: "matched", tmdbId: "949" });
  });

  it("lets an award list's year trail the film's", () => {
    const laStrada = { title: "La Strada", year: 1956 };
    const results = [result(405, "La Strada", "1954-09-06")];
    expect(pickListMatch(laStrada, results, 1).status).toBe("missing");
    expect(pickListMatch(laStrada, results, 2)).toEqual({
      status: "matched",
      tmdbId: "405",
    });
  });

  it("matches an original or alternative title", () => {
    expect(
      pickListMatch(
        { title: "A One and a Two", altTitles: ["Yi Yi"], year: 2000 },
        [result(25538, "Yi Yi", "2000-09-20", "一一")],
      ),
    ).toEqual({ status: "matched", tmdbId: "25538" });
  });

  it("prefers the nearest year, and calls a tie ambiguous", () => {
    const entry = { title: "Solaris", year: 1972 };
    expect(
      pickListMatch(entry, [
        result(593, "Solaris", "1972-03-20"),
        result(2103, "Solaris", "1971-01-01"),
      ]),
    ).toEqual({ status: "matched", tmdbId: "593" });
    expect(
      pickListMatch(entry, [
        result(593, "Solaris", "1972-03-20"),
        result(9999, "Solaris", "1972-06-01"),
      ]),
    ).toMatchObject({ status: "ambiguous", candidates: expect.any(Array) });
  });

  it("never matches on a different title", () => {
    expect(
      pickListMatch({ title: "Heat", year: 1995 }, [
        result(1, "Heat Wave", "1995-01-01"),
      ]).status,
    ).toBe("missing");
  });
});

const SOURCE = `import type { MovieListEntry } from "./types";

/** A list { with braces } in its comment. */
export const SAMPLE: MovieListEntry[] = [
  { rank: 1, title: "Heat", year: 1995 },
  {
    rank: 2,
    title: "A \\"quoted\\" {title}",
    altTitles: ["Other"],
    year: 2000,
  },
  // A comment between entries { }
  { rank: 3, title: "Done", year: 2001, tmdbId: "5" },
];
`;

describe("insertTmdbIds", () => {
  it("finds every entry, past strings and comments", () => {
    expect(findEntryObjects(SOURCE, "SAMPLE")).toHaveLength(3);
  });

  it("adds ids as each entry's last property, leaving the rest alone", () => {
    const updated = insertTmdbIds(SOURCE, "SAMPLE", ["949", "7", undefined]);
    expect(updated).toContain(
      '{ rank: 1, title: "Heat", year: 1995, tmdbId: "949" }',
    );
    expect(updated).toMatch(/year: 2000, tmdbId: "7" }/);
    expect(updated).toContain(
      '{ rank: 3, title: "Done", year: 2001, tmdbId: "5" }',
    );
    expect(updated).toContain("// A comment between entries { }");
  });

  it("refuses when the count doesn't match", () => {
    expect(() => insertTmdbIds(SOURCE, "SAMPLE", ["1"])).toThrow(
      /found 3 entries/,
    );
  });

  it("counts a real list file's entries correctly", () => {
    const source = readFileSync(
      new URL(
        "../../src/data/movie-lists/palme-dor-winners.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const list = MOVIE_LISTS.find(({ id }) => id === "palme-dor-winners");
    expect(findEntryObjects(source, "PALME_DOR_WINNERS")).toHaveLength(
      list.entries.length,
    );
  });
});

describe("the script's list table", () => {
  it("covers every curated list, with the registry's year tolerance", () => {
    const curated = MOVIE_LISTS.filter((list) => list.kind === "curated");
    expect(LIST_FILES.map(({ id }) => id).sort()).toEqual(
      curated.map(({ id }) => id).sort(),
    );
    for (const list of curated) {
      const file = LIST_FILES.find(({ id }) => id === list.id);
      expect(file.yearTolerance).toBe(list.yearTolerance ?? 1);
    }
  });
});
