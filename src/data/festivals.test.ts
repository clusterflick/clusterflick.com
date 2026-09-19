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
