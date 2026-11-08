import { describe, expect, it } from "vitest";
import type { Movie } from "@/types";
import { searchShowingFilms } from "./search-showing-films";

function movie(id: string, title: string, extra: Partial<Movie> = {}): Movie {
  return {
    id,
    title,
    normalizedTitle: title.toLowerCase().replace(/^the /, ""),
    showings: {},
    performances: [],
    ...extra,
  };
}

const movies = Object.fromEntries(
  [
    movie("1", "Jodorowsky's Dune"),
    movie("2", "Dune: Part Two"),
    movie("3", "Dune"),
    movie("4", "Fortunes of War"),
    movie("5", "Amélie", {
      originalTitle: "Le Fabuleux Destin d'Amélie Poulain",
    }),
    movie("6", "The Godfather Part II"),
  ].map((film) => [film.id, film]),
);

const titles = (query: string) =>
  searchShowingFilms(movies, query).map(({ title }) => title);

describe("searchShowingFilms", () => {
  it("puts titles starting with the query first, then word starts, then the rest", () => {
    expect(titles("dune")).toEqual([
      "Dune",
      "Dune: Part Two",
      "Jodorowsky's Dune",
    ]);
    // "fortu" starts the title; "une" is only inside words.
    expect(titles("une")).toEqual([
      "Dune",
      "Dune: Part Two",
      "Fortunes of War",
      "Jodorowsky's Dune",
    ]);
  });

  it("matches the way the catalogue does: accents, original titles, numerals", () => {
    expect(titles("amelie")).toEqual(["Amélie"]);
    expect(titles("fabuleux")).toEqual(["Amélie"]);
    expect(titles("godfather part 2")).toEqual(["The Godfather Part II"]);
  });

  it("finds nothing for an empty or punctuation-only query", () => {
    expect(titles("")).toEqual([]);
    expect(titles("  ?! ")).toEqual([]);
  });
});
