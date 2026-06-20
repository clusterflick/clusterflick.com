import { describe, it, expect } from "vitest";
import {
  getAllowedFilmTitles,
  findUnknownFilms,
  findUnknownDirectors,
} from "./validate-summary.mjs";

describe("getAllowedFilmTitles", () => {
  it("collects movie titles, lowercased, ignoring venue-only links", () => {
    const links = [
      { phrase: "2001: A Space Odyssey", movieId: "m1" },
      { phrase: "Eyes Wide Shut", movieId: "m2" },
      { phrase: "Prince Charles Cinema", venueId: "v1" },
    ];
    const allowed = getAllowedFilmTitles(links);
    expect(allowed).toEqual(
      new Set(["2001: a space odyssey", "eyes wide shut"]),
    );
  });

  it("is empty for missing/empty input", () => {
    expect(getAllowedFilmTitles(undefined)).toEqual(new Set());
    expect(getAllowedFilmTitles([])).toEqual(new Set());
  });
});

describe("findUnknownFilms", () => {
  const allowed = getAllowedFilmTitles([
    { phrase: "Late Spring", movieId: "m1" },
    { phrase: "The Dark Knight", movieId: "m2" },
  ]);

  it("returns no unknowns when every mentioned film is allowed", () => {
    expect(
      findUnknownFilms(["Late Spring", "The Dark Knight"], allowed),
    ).toEqual([]);
  });

  it("flags a hallucinated title not in the candidate set", () => {
    expect(
      findUnknownFilms(["Late Spring", "Basic Instinct"], allowed),
    ).toEqual(["Basic Instinct"]);
  });

  it("matches case- and whitespace-insensitively", () => {
    expect(
      findUnknownFilms(["  late spring  ", "THE DARK KNIGHT"], allowed),
    ).toEqual([]);
  });

  it("ignores non-string and empty entries", () => {
    // @ts-expect-error — exercising defensive runtime handling of bad input
    expect(findUnknownFilms([null, "", "Basic Instinct"], allowed)).toEqual([
      "Basic Instinct",
    ]);
  });
});

describe("findUnknownDirectors", () => {
  const allowed = ["Stanley Kubrick", "Paul Verhoeven"];

  it("accepts an exact supplied name", () => {
    expect(findUnknownDirectors(["Stanley Kubrick"], allowed)).toEqual([]);
  });

  it("accepts an editorial surname that matches a supplied full name", () => {
    expect(findUnknownDirectors(["Kubrick", "Verhoeven"], allowed)).toEqual([]);
  });

  it("flags a fabricated director", () => {
    expect(
      findUnknownDirectors(["Kubrick", "Arthur H. Vance"], allowed),
    ).toEqual(["Arthur H. Vance"]);
  });

  it("matches case- and punctuation-insensitively", () => {
    expect(findUnknownDirectors(["stanley kubrick"], allowed)).toEqual([]);
  });

  it("returns [] for empty/missing input", () => {
    expect(findUnknownDirectors([], allowed)).toEqual([]);
    expect(findUnknownDirectors(undefined, allowed)).toEqual([]);
    expect(findUnknownDirectors(["Kubrick"], undefined)).toEqual(["Kubrick"]);
  });
});
