import { describe, it, expect } from "vitest";
import type { IncludedMovie, Movie } from "../../types";
import { FilterId, type MoviesRecord } from "../types";
import { getDefaultState, set } from "../manager";
import { normalizeForSearch } from "../normalize";
import {
  findIncludedTitleMatch,
  matchesTitleSearch,
  searchFilter,
} from "./search";

function makeMovie(
  id: string,
  title: string,
  extra: Partial<Movie> = {},
): Movie {
  return {
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    showings: {},
    performances: [],
    ...extra,
  } as Movie;
}

function included(id: string, title: string): IncludedMovie {
  return { id, title, normalizedTitle: title.toLowerCase() };
}

const MOVIES: MoviesRecord = {
  "1": makeMovie("1", "Programmers of Tomorrow: Film Festival All-Dayer", {
    includedMovies: [
      included("11", "Talking About Trees"),
      included("12", "Emuthi Puthi"),
      included("13", "Speed Racer"),
    ],
  }),
  "2": makeMovie("2", "Speed Racer"),
  "3": makeMovie("3", "Amélie", {
    originalTitle: "Le Fabuleux Destin d'Amélie Poulain",
  }),
  "4": makeMovie("4", "Heat"),
  "5": makeMovie("5", "Zootopia", { alternativeTitles: ["Zootropolis"] }),
  "6": makeMovie("6", "Pixar Double Bill", {
    includedMovies: [
      {
        ...included("61", "Inside Out"),
        alternativeTitles: ["Del revés"],
      },
    ],
  }),
};

function search(query: string): string[] {
  const state = set(getDefaultState(), FilterId.Search, query);
  return Object.keys(searchFilter.apply(MOVIES, state)).sort();
}

describe("searchFilter", () => {
  it("finds a film by its own title", () => {
    expect(search("heat")).toEqual(["4"]);
  });

  it("finds a film by its original-language title", () => {
    expect(search("fabuleux")).toEqual(["3"]);
  });

  it("finds a film by another English title it was released under", () => {
    expect(search("zootropolis")).toEqual(["5"]);
  });

  it("finds an event by another title of a film it screens", () => {
    expect(search("del reves")).toEqual(["6"]);
  });

  it("finds an event by the title of a film it screens", () => {
    expect(search("talking about trees")).toEqual(["1"]);
  });

  it("is as forgiving of an included title as of the event's own", () => {
    expect(search("Talking-About  TREES")).toEqual(["1"]);
  });

  it("finds a film and the event screening it together", () => {
    expect(search("speed racer")).toEqual(["1", "2"]);
  });

  it("still finds an event by its own title", () => {
    expect(search("all-dayer")).toEqual(["1"]);
  });
});

describe("findIncludedTitleMatch", () => {
  it("names the screened film that matched", () => {
    expect(
      findIncludedTitleMatch(MOVIES["1"], normalizeForSearch("emuthi")),
    ).toBe("Emuthi Puthi");
  });

  it("is undefined for a film that screens nothing else", () => {
    expect(
      findIncludedTitleMatch(MOVIES["2"], normalizeForSearch("speed racer")),
    ).toBeUndefined();
  });

  it("is undefined when the event matched only by its own title", () => {
    expect(
      findIncludedTitleMatch(MOVIES["1"], normalizeForSearch("programmers")),
    ).toBeUndefined();
    expect(
      matchesTitleSearch(MOVIES["1"], normalizeForSearch("programmers")),
    ).toBe(true);
  });
});
