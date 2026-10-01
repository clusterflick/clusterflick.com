import { describe, it, expect } from "vitest";
import { Category } from "@/types";
import {
  FilterId,
  describeFilterChips,
  getDefaultState,
  getPermissiveState,
  set,
  FilterState,
} from "@/lib/filters";
import { getRowStatuses } from "./filter-targets";

const statuses = (state: FilterState) =>
  getRowStatuses(
    describeFilterChips({
      state,
      categories: [{ value: Category.Movie, label: "Films" }],
      venues: null,
      genres: { "27": { id: "27", name: "Horror" } },
      people: { d1: { id: "d1", name: "Ridley Scott" } },
      cinemaVenueIds: [],
    }),
    state,
  );

describe("getRowStatuses", () => {
  it("reads every row as Any by default, the core defaults included", () => {
    const rows = statuses(getDefaultState());
    expect(rows.genre).toEqual({ summary: "Any", isSet: false });
    expect(rows.people).toEqual({ summary: "Any", isSet: false });
    expect(rows.showings).toEqual({ summary: "Hiding past", isSet: false });
  });

  it("summarises a row with the strip's own labels", () => {
    let state = set(getDefaultState(), FilterId.Genres, ["27"]);
    state = set(state, FilterId.Directors, ["d1"]);
    state = set(state, FilterId.LetterboxdRating, 4);
    state = set(state, FilterId.ImdbRating, 8);
    const rows = statuses(state);
    expect(rows.genre).toEqual({ summary: "Horror", isSet: true });
    expect(rows.people).toEqual({
      summary: "Directed by Ridley Scott",
      isSet: true,
    });
    expect(rows.ratings).toEqual({
      summary: "Letterboxd 4.0+ · IMDb 8.0+",
      isSet: true,
    });
  });

  it("counts Showings as set once it differs from hiding past showings", () => {
    expect(statuses(getPermissiveState()).showings).toEqual({
      summary: "Including past",
      isSet: true,
    });
    const soldOut = set(getDefaultState(), FilterId.HideSoldOut, true);
    expect(statuses(soldOut).showings).toEqual({
      summary: "Hiding past and sold out",
      isSet: true,
    });
  });
});
