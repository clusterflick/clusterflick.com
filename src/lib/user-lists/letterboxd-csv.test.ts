import { describe, it, expect } from "vitest";
import type { Movie } from "@/types";
import {
  formatLetterboxdCsv,
  LetterboxdCsvError,
  matchLetterboxdRows,
  parseCsv,
  parseLetterboxdCsv,
} from "./letterboxd-csv";

const movie = (id: string, title: string, year?: string): Movie =>
  ({
    id,
    title,
    year,
    normalizedTitle: title.toLowerCase(),
    posterPath: `/${id}.jpg`,
    showings: {},
    performances: [],
  }) as unknown as Movie;

const NOW = Date.UTC(2026, 8, 25);

describe("parseCsv", () => {
  it("reads quoted fields holding commas, quotes and line breaks", () => {
    expect(
      parseCsv('a,b\r\n"Crouching Tiger, Hidden Dragon","The ""Best""\nOne"\n'),
    ).toEqual([
      ["a", "b"],
      ["Crouching Tiger, Hidden Dragon", 'The "Best"\nOne'],
    ]);
  });

  it("drops blank lines", () => {
    expect(parseCsv("a\n\nb\n\n")).toEqual([["a"], ["b"]]);
  });
});

describe("parseLetterboxdCsv", () => {
  it("reads Letterboxd's export", () => {
    const text =
      "﻿Date,Name,Year,Letterboxd URI\n" +
      "2024-03-01,In the Mood for Love,2000,https://boxd.it/2a9c\n";
    expect(parseLetterboxdCsv(text)).toEqual([
      {
        title: "In the Mood for Love",
        year: 2000,
        date: Date.UTC(2024, 2, 1),
      },
    ]);
  });

  it("prefers the diary's watched date over its logged date", () => {
    const text =
      "Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date\n" +
      "2024-03-05,Alien,1979,https://boxd.it/x,4,,,2024-03-01\n";
    expect(parseLetterboxdCsv(text)[0].date).toBe(Date.UTC(2024, 2, 1));
  });

  it("reads Letterboxd's import format", () => {
    expect(parseLetterboxdCsv("Title,Year,tmdbID\nAlien,1979,348\n")).toEqual([
      { title: "Alien", year: 1979, tmdbId: "348" },
    ]);
  });

  it("rejects a file with no title column", () => {
    expect(() => parseLetterboxdCsv("foo,bar\n1,2\n")).toThrow(
      LetterboxdCsvError,
    );
  });

  it("skips rows without a title", () => {
    expect(parseLetterboxdCsv("Name,Year\n,2000\nAlien,\n")).toEqual([
      { title: "Alien" },
    ]);
  });
});

describe("matchLetterboxdRows", () => {
  const movies = [
    movie("348", "Alien", "1979"),
    movie("843", "In the Mood for Love", "2000"),
    movie("9999", "Alien", "2032"),
  ];

  it("matches by TMDB id, then by title and year", () => {
    const matched = matchLetterboxdRows(
      [
        { title: "Something else entirely", tmdbId: "843" },
        { title: "Alien", year: 1979, date: Date.UTC(2020, 0, 1) },
        { title: "Not Showing", year: 1990 },
      ],
      movies,
      NOW,
    );
    expect(matched).toEqual({
      "843": {
        title: "In the Mood for Love",
        year: "2000",
        posterPath: "/843.jpg",
        addedAt: NOW,
      },
      "348": {
        title: "Alien",
        year: "1979",
        posterPath: "/348.jpg",
        addedAt: Date.UTC(2020, 0, 1),
      },
    });
  });

  it("keeps a film named twice once, at its earliest date", () => {
    const matched = matchLetterboxdRows(
      [
        { title: "Alien", year: 1979, date: Date.UTC(2022, 0, 1) },
        { title: "Alien", year: 1979, date: Date.UTC(2020, 0, 1) },
      ],
      movies,
      NOW,
    );
    expect(Object.keys(matched)).toEqual(["348"]);
    expect(matched["348"].addedAt).toBe(Date.UTC(2020, 0, 1));
  });
});

describe("formatLetterboxdCsv", () => {
  it("writes the import format oldest first, escaping titles", () => {
    const csv = formatLetterboxdCsv(
      {
        "843": { title: "In the Mood for Love", year: "2000", addedAt: 2 },
        "unmatched-1": { title: 'Shorts, "Vol. 2"', addedAt: 1 },
      },
      (id) => /^\d+$/.test(id),
    );
    expect(csv).toBe(
      "Title,Year,tmdbID\r\n" +
        '"Shorts, ""Vol. 2""",,\r\n' +
        "In the Mood for Love,2000,843\r\n",
    );
  });

  it("round-trips through the import", () => {
    const csv = formatLetterboxdCsv(
      { "348": { title: "Alien", year: "1979", addedAt: 1 } },
      () => true,
    );
    expect(parseLetterboxdCsv(csv)).toEqual([
      { title: "Alien", year: 1979, tmdbId: "348" },
    ]);
  });
});
