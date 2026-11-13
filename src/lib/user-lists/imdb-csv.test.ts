import { describe, it, expect } from "vitest";
import type { Movie } from "@/types";
import { isImdbHeader, parseImdbCsv } from "./imdb-csv";
import { matchLetterboxdRows } from "./letterboxd-csv";

// The headers below follow third-party descriptions of IMDb's exports, not a
// file exported from IMDb itself: check them against a real export.
const WATCHLIST = [
  "Position,Const,Created,Modified,Description,Title,Original Title,URL,Title Type,IMDb Rating,Runtime (mins),Year,Genres,Num Votes,Release Date,Directors,Your Rating,Date Rated",
  '1,tt0133093,2024-03-01,2024-03-01,,The Matrix,The Matrix,https://www.imdb.com/title/tt0133093/,Movie,8.7,136,1999,"Action, Sci-Fi",2000000,1999-03-24,"Lana Wachowski, Lilly Wachowski",,',
  "2,tt0903747,2024-03-02,2024-03-02,,Breaking Bad,Breaking Bad,https://www.imdb.com/title/tt0903747/,TV Series,9.5,49,2008,Drama,2000000,2008-01-20,,,",
  '3,tt0118799,2024-03-03,2024-03-03,,Life Is Beautiful,"La vita è bella",https://www.imdb.com/title/tt0118799/,Movie,8.6,116,1997,Comedy,700000,1997-12-20,Roberto Benigni,,',
].join("\r\n");

const RATINGS = [
  "Const,Your Rating,Date Rated,Title,URL,Title Type,IMDb Rating,Runtime (mins),Year,Genres,Num Votes,Release Date,Directors",
  "tt0078748,9,2023-10-31,Alien,https://www.imdb.com/title/tt0078748/,Movie,8.5,117,1979,Horror,900000,1979-05-25,Ridley Scott",
  "tt0959621,10,2023-11-01,Pilot,https://www.imdb.com/title/tt0959621/,TV Episode,8.2,58,2008,Drama,40000,2008-01-20,Vince Gilligan",
].join("\n");

describe("isImdbHeader", () => {
  it("knows IMDb's by its Const column, in either case", () => {
    expect(isImdbHeader(["Const", "Title"])).toBe(true);
    expect(isImdbHeader(["position", "const", "title"])).toBe(true);
    expect(isImdbHeader(["Date", "Name", "Year", "Letterboxd URI"])).toBe(
      false,
    );
  });
});

describe("parseImdbCsv", () => {
  it("reads a list export, leaving out series", () => {
    expect(parseImdbCsv(WATCHLIST)).toEqual({
      rows: [
        {
          title: "The Matrix",
          year: 1999,
          imdbId: "tt0133093",
          date: Date.UTC(2024, 2, 1),
        },
        {
          title: "Life Is Beautiful",
          altTitles: ["La vita è bella"],
          year: 1997,
          imdbId: "tt0118799",
          date: Date.UTC(2024, 2, 3),
        },
      ],
      skipped: [{ title: "Breaking Bad", type: "TV Series" }],
    });
  });

  it("dates a rating by when it was rated, leaving out episodes", () => {
    expect(parseImdbCsv(RATINGS)).toEqual({
      rows: [
        {
          title: "Alien",
          year: 1979,
          imdbId: "tt0078748",
          date: Date.UTC(2023, 9, 31),
        },
      ],
      skipped: [{ title: "Pilot", type: "TV Episode" }],
    });
  });

  it("reads the older lower-case export, whose types are camel case", () => {
    const csv = [
      "﻿position,const,created,modified,description,Title,Title type,Directors,You rated,IMDb Rating,Runtime (mins),Year,Genres,Num. Votes,Release Date (month/day/year),URL",
      "1,tt0078748,Mon Jan  9 00:00:00 2017,,,Alien,feature,Ridley Scott,,8.5,117,1979,Horror,900000,1979-05-25,https://www.imdb.com/title/tt0078748/",
      "2,tt0903747,Mon Jan  9 00:00:00 2017,,,Breaking Bad,tvSeries,,,9.5,49,2008,Drama,2000000,2008-01-20,https://www.imdb.com/title/tt0903747/",
    ].join("\n");
    expect(parseImdbCsv(csv)).toEqual({
      // A date it can't read is left out rather than guessed.
      rows: [{ title: "Alien", year: 1979, imdbId: "tt0078748" }],
      skipped: [{ title: "Breaking Bad", type: "tvSeries" }],
    });
  });

  it("keeps a row whose id isn't IMDb's, without the id", () => {
    expect(parseImdbCsv("Const,Title,Year\nnope,Alien,1979\n")?.rows).toEqual([
      { title: "Alien", year: 1979 },
    ]);
  });

  it("isn't an IMDb file without Const or Title", () => {
    expect(parseImdbCsv("Date,Name,Year\n2024-01-01,Alien,1979\n")).toBeNull();
    expect(parseImdbCsv("Const,Year\ntt0078748,1979\n")).toBeNull();
    expect(parseImdbCsv("")).toBeNull();
  });
});

describe("matching IMDb rows", () => {
  it("finds a showing film by its IMDb id, whatever its title", () => {
    const movie = {
      id: "348",
      title: "Alien (Director's Cut)",
      year: "2003",
      imdbId: "tt0078748",
      posterPath: "/348.jpg",
      showings: {},
      performances: [],
    } as unknown as Movie;
    const { rows } = parseImdbCsv(RATINGS)!;
    const { matched, unmatched } = matchLetterboxdRows(rows, [movie]);
    expect(Object.keys(matched)).toEqual(["348"]);
    expect(unmatched).toEqual([]);
  });
});
