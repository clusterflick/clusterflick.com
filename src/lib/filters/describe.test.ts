import { describe, it, expect } from "vitest";
import { Category } from "@/types";
import { FilterId } from "./types";
import { getDefaultState, set } from "./manager";
import { describeFilters, formatList } from "./describe";

const CATEGORIES = [
  { value: Category.Movie, label: "Films" },
  { value: Category.Quiz, label: "Quizzes" },
];
const GENRES = {
  "27": { id: "27", name: "Horror" },
  "35": { id: "35", name: "Comedy" },
};
const PEOPLE = {
  d1: { id: "d1", name: "Ridley Scott" },
  d2: { id: "d2", name: "George Lucas" },
  a1: { id: "a1", name: "Mark Hamill" },
  a2: { id: "a2", name: "Harrison Ford" },
};

const events = (state = getDefaultState()) =>
  describeFilters({
    state,
    categories: CATEGORIES,
    venues: null,
    genres: GENRES,
    people: PEOPLE,
    cinemaVenueIds: [],
  }).events;

describe("formatList", () => {
  it("joins with the conjunction it is given", () => {
    expect(formatList(["A", "B"], 3)).toBe("A & B");
    expect(formatList(["A", "B"], 3, "", "or")).toBe("A or B");
    expect(formatList(["A", "B", "C"], 3, "", "or")).toBe("A, B or C");
  });

  it("uses it in the truncated form too, so the logic never flips mid-list", () => {
    expect(formatList(["A", "B", "C", "D"], 2, "", "or")).toBe("A or 3 more");
  });
});

// Every multi-select filter matches a film satisfying *any* selected value, so
// "&" would state the opposite of what the filter does.
describe("describeFilters reads multi-select filters as or", () => {
  it("joins directors and cast with or, and the two groups with and", () => {
    let state = set(getDefaultState(), FilterId.Directors, ["d1", "d2"]);
    state = set(state, FilterId.Cast, ["a1", "a2"]);
    expect(events(state)).toContain(
      "directed by Ridley Scott or George Lucas and starring Mark Hamill or Harrison Ford",
    );
  });

  it("joins genres with or", () => {
    const state = set(getDefaultState(), FilterId.Genres, ["27", "35"]);
    expect(events(state)).toContain("Horror or Comedy Genre");
  });

  it("joins event types with or", () => {
    const state = set(getDefaultState(), FilterId.Categories, [
      Category.Movie,
      Category.Quiz,
    ]);
    expect(events(state)).toContain("Films or Quizzes");
  });

  // Hiding finished showings is the default, so only turning it off is said.
  it("mentions finished showings only when they are included", () => {
    const dates = (state: ReturnType<typeof getDefaultState>) =>
      describeFilters({
        state,
        categories: CATEGORIES,
        venues: null,
        genres: GENRES,
        people: PEOPLE,
        cinemaVenueIds: [],
      }).dates;

    expect(dates(getDefaultState())).not.toContain("finished");
    const included = set(getDefaultState(), FilterId.HideFinished, false);
    expect(dates(included)).toContain(", including finished");
    const both = set(included, FilterId.HideSoldOut, true);
    expect(dates(both)).toContain("and not sold out, including finished");
  });
});
