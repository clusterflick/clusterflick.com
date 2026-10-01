import { describe, it, expect } from "vitest";
import { AccessibilityFeature, Category } from "@/types";
import { FilterId } from "./types";
import { getDefaultState, set } from "./manager";
import {
  applyFilterSearchEntry,
  buildFilterSearchGroups,
  isFilterSearchEntrySelected,
  searchFilterGroups,
} from "./filter-search";

const groups = buildFilterSearchGroups({
  categories: [
    { value: Category.Movie, label: "Films" },
    { value: Category.Quiz, label: "Quizzes" },
  ],
  genres: {
    "27": { id: "27", name: "Horror" },
    "878": { id: "878", name: "Science Fiction" },
  },
  people: {
    [FilterId.Directors]: [
      { id: "d1", name: "Alfred Hitchcock", count: 6 },
      { id: "d2", name: "Ridley Scott", count: 2 },
    ],
    [FilterId.Cast]: [
      { id: "a1", name: "Patricia Hitchcock", count: 1 },
      { id: "a2", name: "Louise Rioton", count: 1 },
    ],
  },
  venues: [
    { id: "v1", name: "The Castle Cinema", count: 40 },
    { id: "v2", name: "Rio Cinema", count: 49 },
  ],
});

const names = (query: string) =>
  searchFilterGroups(groups, query).map(
    (entry) => `${entry.kind}: ${entry.name}`,
  );

describe("searchFilterGroups", () => {
  it("matches the start of any word, as typed", () => {
    expect(names("hitch")).toEqual([
      "Director: Alfred Hitchcock",
      "Cast: Patricia Hitchcock",
    ]);
    expect(names("alfred hitch")).toEqual(["Director: Alfred Hitchcock"]);
  });

  it("doesn't match inside a word", () => {
    expect(names("cock")).toEqual([]);
  });

  it("reads aliases and folded endings", () => {
    expect(names("subs")).toEqual(["Accessibility: Subtitles"]);
    expect(names("subtitled")).toEqual(["Accessibility: Subtitles"]);
    expect(names("sci-fi")).toEqual(["Genre: Science Fiction"]);
    expect(names("quiz")).toEqual(["Event type: Quizzes"]);
  });

  it("never offers a format's default", () => {
    expect(names("digital")).toEqual([]);
    expect(names("70mm")).toEqual(["Format: 70mm", "Format: IMAX 70mm"]);
  });

  it("offers venues, which the suggestion engine leaves out", () => {
    expect(names("castle")).toEqual(["Venue: The Castle Cinema"]);
  });

  it("lists whole-word matches before ones completing a word", () => {
    expect(names("rio")).toEqual([
      "Film club: Rio Feminist Film Group",
      "Venue: Rio Cinema",
      "Cast: Louise Rioton",
    ]);
  });

  it("answers nothing to a single letter", () => {
    expect(names("h")).toEqual([]);
  });
});

const entry = (key: string) =>
  groups.flat().find((candidate) => candidate.key === key)!;

describe("applyFilterSearchEntry", () => {
  it("replaces a filter at its default or at everything, and clears the query", () => {
    const state = set(getDefaultState(), FilterId.Search, "quiz");
    const next = applyFilterSearchEntry(
      state,
      entry(`${FilterId.Categories}:${Category.Quiz}`),
    );
    expect(next.categories).toEqual([Category.Quiz]);
    expect(next.search).toBe("");

    const subtitled = applyFilterSearchEntry(
      getDefaultState(),
      entry(`${FilterId.Accessibility}:${AccessibilityFeature.Subtitled}`),
    );
    expect(subtitled.accessibility).toEqual([AccessibilityFeature.Subtitled]);
  });

  it("adds to a selection the reader made, and takes away on a second pick", () => {
    const one = applyFilterSearchEntry(
      getDefaultState(),
      entry(`${FilterId.Directors}:d1`),
    );
    const two = applyFilterSearchEntry(one, entry(`${FilterId.Directors}:d2`));
    expect(two.directors).toEqual(["d1", "d2"]);
    expect(
      isFilterSearchEntrySelected(two, entry(`${FilterId.Directors}:d2`)),
    ).toBe(true);

    const back = applyFilterSearchEntry(two, entry(`${FilterId.Directors}:d2`));
    expect(back.directors).toEqual(["d1"]);
    const none = applyFilterSearchEntry(
      back,
      entry(`${FilterId.Directors}:d1`),
    );
    expect(none.directors).toBeNull();
  });

  it("selects just the venue when every venue is selected", () => {
    const next = applyFilterSearchEntry(
      getDefaultState(),
      entry(`${FilterId.Venues}:v1`),
    );
    expect(next.venues).toEqual(["v1"]);
  });
});
