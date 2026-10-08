import { describe, it, expect } from "vitest";
import { FESTIVALS } from "./festivals";
import { FilterId } from "@/lib/filters/types";
import {
  matchesSearchQuery,
  normalizeForSearch,
} from "@/lib/filters/normalize";

const GARDEN_NOTES: [note: string, festivalId: string][] = [
  [
    "Part of Doc'n Roll Film Festival 2026\nThe screening will be followed by a Q&A.",
    "docn-roll-film-festival",
  ],
  [
    "Part of Kino London Short Film Festival 2026\nThe screening will be followed by a discussion.",
    "kino-london-short-film-festival",
  ],
  [
    "Part of Fringe! Queer Film Festival 2026\nThe screening will be followed by a Q&A.",
    "fringe-queer-film-arts-fest",
  ],
  ["Part of Tibet Film Festival London 2026", "tibet-film-festival"],
  ["Part of London Latino Film Festival", "london-latino-film-festival"],
  [
    "Part of London Palestine Film Festival 2026",
    "london-palestine-film-festival",
  ],
];

const matchesNote = (festivalId: string, note: string): boolean => {
  const festival = FESTIVALS.find(({ id }) => id === festivalId);
  if (!festival) throw new Error(`No festival registered as "${festivalId}"`);

  return festival.matchers.some((matcher) => {
    const query = matcher[FilterId.PerformanceNotesSearch];
    if (typeof query !== "string") return false;
    return matchesSearchQuery(note, normalizeForSearch(query));
  });
};

describe("festival performance-note matchers", () => {
  it.each(GARDEN_NOTES)("%s is claimed by %s", (note, festivalId) => {
    expect(matchesNote(festivalId, note)).toBe(true);
  });

  it("does not let one festival claim another's note", () => {
    for (const [note, festivalId] of GARDEN_NOTES) {
      const claimants = FESTIVALS.filter(({ id }) => matchesNote(id, note)).map(
        ({ id }) => id,
      );
      expect(claimants).toEqual([festivalId]);
    }
  });
});

describe("Phoenix Rising International Film Festival title matchers", () => {
  const festival = FESTIVALS.find(
    ({ id }) => id === "phoenix-rising-international-film-festival",
  )!;

  const claims = (title: string): boolean =>
    festival.matchers.some((matcher) => {
      const query = matcher[FilterId.ShowingTitleSearch];
      if (typeof query !== "string") return false;
      return matchesSearchQuery(title, normalizeForSearch(query));
    });

  it("claims the festival by its full name", () => {
    expect(claims("Phoenix Rising International Film Festival")).toBe(true);
  });

  it("claims the festival by its abbreviation", () => {
    expect(claims("PRIFF 2026: Shorts Programme 1")).toBe(true);
  });

  it("does not claim a film titled Phoenix Rising", () => {
    expect(claims("Phoenix Rising")).toBe(false);
  });
});

describe("Turn Up Film Festival title matchers", () => {
  const festival = FESTIVALS.find(({ id }) => id === "turn-up-film-festival")!;

  const claims = (title: string): boolean =>
    festival.matchers.some((matcher) => {
      const query = matcher[FilterId.ShowingTitleSearch];
      if (typeof query !== "string") return false;
      return matchesSearchQuery(title, normalizeForSearch(query));
    });

  it("claims the festival by its full name", () => {
    expect(claims("Turn Up Film Festival: Best Drama Shortlist")).toBe(true);
  });

  it("does not claim a film whose title contains its abbreviation", () => {
    expect(claims("The Right Stuff")).toBe(false);
  });
});
