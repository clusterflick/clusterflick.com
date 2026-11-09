import { describe, it, expect } from "vitest";
import type { Movie } from "@/types";
import { createMovieMatcher } from "./match-movie";

const movie = ({
  id,
  title,
  ...overrides
}: Partial<Movie> & { id: string; title: string }): Movie =>
  ({ id, title, normalizedTitle: title.toLowerCase(), ...overrides }) as Movie;

/** The film a query resolves to among `movies`, or null. */
const matchIn = (
  movies: Movie[],
  query: Parameters<ReturnType<typeof createMovieMatcher>>[0],
  yearTolerance?: number,
) => createMovieMatcher(movies)(query, yearTolerance)?.id ?? null;

// The Letterboxd import's resolver: an export names films by title and year,
// with a TMDB id only in Letterboxd's import format.
describe("createMovieMatcher", () => {
  it("matches a TMDB id directly", () => {
    expect(
      matchIn([movie({ id: "949", title: "Heat" })], {
        title: "Anything",
        tmdbId: "949",
      }),
    ).toBe("949");
  });

  it("matches on IMDb id even when the local title differs", () => {
    const movies = [
      movie({
        id: "1",
        title: "Something Else Entirely",
        year: "1980",
        imdb: { id: "tt0068646" } as Movie["imdb"],
      }),
    ];
    expect(
      matchIn(movies, {
        title: "The Godfather",
        year: 1972,
        imdbId: "tt0068646",
      }),
    ).toBe("1");
  });

  it("matches the Rotten Tomatoes slug in its url", () => {
    const movies = [
      movie({
        id: "3",
        title: "Renamed Locally",
        year: "1972",
        rottenTomatoes: {
          url: "https://www.rottentomatoes.com/m/the_godfather",
        } as Movie["rottenTomatoes"],
      }),
    ];
    expect(
      matchIn(movies, {
        title: "The Godfather",
        year: 1972,
        rtSlug: "the_godfather",
      }),
    ).toBe("3");
  });

  it("falls back to title and year, tolerating a year either side", () => {
    const movies = [movie({ id: "4", title: "Seven Samurai", year: "1955" })];
    expect(matchIn(movies, { title: "Seven Samurai", year: 1954 })).toBe("4");
  });

  it("matches titles across roman numerals and punctuation", () => {
    const movies = [
      movie({ id: "5", title: "The Godfather Part 2", year: "1974" }),
    ];
    expect(
      matchIn(movies, { title: "The Godfather, Part II", year: 1974 }),
    ).toBe("5");
  });

  it("matches on an alternative title when the main one doesn't", () => {
    const movies = [movie({ id: "17", title: "Yi Yi", year: "2000" })];
    expect(
      matchIn(movies, {
        title: "A One and a Two",
        altTitles: ["Yi Yi"],
        year: 2000,
      }),
    ).toBe("17");
  });

  it("rejects a title match when the year is too far off", () => {
    // The 1998 remake is not the film the query means.
    const movies = [movie({ id: "6", title: "Psycho", year: "1998" })];
    expect(matchIn(movies, { title: "Psycho", year: 1960 })).toBeNull();
    expect(matchIn(movies, { title: "Psycho", year: 1960 }, 40)).toBe("6");
  });
});
