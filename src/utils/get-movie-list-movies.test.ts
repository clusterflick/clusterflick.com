import { describe, it, expect } from "vitest";
import { Category, type Movie } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import {
  buildMovieListIndex,
  getMovieListsForMovie,
} from "./get-movie-list-movies";
import {
  MOVIE_LISTS,
  MovieListSource,
  type MovieList,
  type MovieListEntry,
} from "@/data/movie-lists";

const FUTURE = new Date("2099-01-01T20:00:00Z").getTime();

const movie = ({
  id,
  title,
  ...overrides
}: Partial<Movie> & { id: string; title: string }): Movie =>
  ({
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    showings: {
      [`${id}-s`]: {
        id: `${id}-s`,
        category: Category.Movie,
        venueId: "a.com",
        url: "https://a.com",
      },
    },
    performances: [{ showingId: `${id}-s`, time: FUTURE, bookingUrl: "" }],
    ...overrides,
  }) as unknown as Movie;

const record = (movies: Movie[]): MoviesRecord =>
  Object.fromEntries(movies.map((m) => [m.id, m]));

const curatedList = (entries: MovieListEntry[]): MovieList => ({
  id: "test-curated",
  name: "Test Curated List",
  badgeLabel: "Test",
  aliases: [],
  kind: "curated",
  source: MovieListSource.Editorial,
  sourceName: "Test Source",
  sourceUrl: "https://example.com",
  description: "A test list.",
  entries,
});

/** The films a one-off list resolves to, bypassing the registry. */
const filmsFor = (list: MovieList, movies: MoviesRecord) =>
  buildMovieListIndex(movies, [list]).byList.get(list.id) ?? [];

describe("curated list matching", () => {
  it("matches on IMDb id even when the local title differs", () => {
    const movies = record([
      movie({
        id: "1",
        title: "Something Else Entirely",
        year: "1980",
        imdb: { id: "tt0068646" } as Movie["imdb"],
      }),
    ]);

    const films = filmsFor(
      curatedList([
        { rank: 1, title: "The Godfather", year: 1972, imdbId: "tt0068646" },
      ]),
      movies,
    );

    expect(films).toHaveLength(1);
    expect(films[0].movie.id).toBe("1");
    expect(films[0].rank).toBe(1);
  });

  it("matches the Rotten Tomatoes slug in a compressed url", () => {
    const movies = record([
      movie({
        id: "2",
        title: "Renamed Locally",
        year: "1972",
        rottenTomatoes: {
          url: "{102}the_godfather",
        } as Movie["rottenTomatoes"],
      }),
    ]);

    const films = filmsFor(
      curatedList([
        {
          rank: 1,
          title: "The Godfather",
          year: 1972,
          rtSlug: "the_godfather",
        },
      ]),
      movies,
    );

    expect(films[0]?.movie.id).toBe("2");
  });

  it("matches the Rotten Tomatoes slug in a hydrated url", () => {
    const movies = record([
      movie({
        id: "3",
        title: "Renamed Locally",
        year: "1972",
        rottenTomatoes: {
          url: "https://www.rottentomatoes.com/m/the_godfather",
        } as Movie["rottenTomatoes"],
      }),
    ]);

    const films = filmsFor(
      curatedList([
        {
          rank: 1,
          title: "The Godfather",
          year: 1972,
          rtSlug: "the_godfather",
        },
      ]),
      movies,
    );

    expect(films[0]?.movie.id).toBe("3");
  });

  it("falls back to title and year, tolerating a year either side", () => {
    const movies = record([
      movie({ id: "4", title: "Seven Samurai", year: "1955" }),
    ]);

    const films = filmsFor(
      curatedList([{ rank: 1, title: "Seven Samurai", year: 1954 }]),
      movies,
    );

    expect(films[0]?.movie.id).toBe("4");
  });

  it("matches titles across roman numerals and punctuation", () => {
    const movies = record([
      movie({ id: "5", title: "The Godfather Part 2", year: "1974" }),
    ]);

    const films = filmsFor(
      curatedList([{ rank: 1, title: "The Godfather, Part II", year: 1974 }]),
      movies,
    );

    expect(films[0]?.movie.id).toBe("5");
  });

  it("matches on an alternative title when the main one doesn't", () => {
    // The Guardian lists "A One and a Two"; the cinema lists it as "Yi Yi".
    const movies = record([movie({ id: "17", title: "Yi Yi", year: "2000" })]);

    const films = filmsFor(
      curatedList([
        {
          rank: 26,
          title: "A One and a Two",
          altTitles: ["Yi Yi"],
          year: 2000,
        },
      ]),
      movies,
    );

    expect(films[0]?.movie.id).toBe("17");
  });

  it("rejects a title match when the year is too far off", () => {
    // The 1998 remake is not the film the list means.
    const movies = record([movie({ id: "6", title: "Psycho", year: "1998" })]);

    const films = filmsFor(
      curatedList([{ rank: 1, title: "Psycho", year: 1960 }]),
      movies,
    );

    expect(films).toHaveLength(0);
  });

  it("keeps published order and skips films that aren't showing", () => {
    const movies = record([
      movie({ id: "7", title: "Casablanca", year: "1942" }),
      movie({ id: "8", title: "Chinatown", year: "1974" }),
    ]);

    const films = filmsFor(
      curatedList([
        { rank: 1, title: "Chinatown", year: 1974 },
        { rank: 2, title: "Not Showing Anywhere", year: 1990 },
        { rank: 3, title: "Casablanca", year: 1942 },
      ]),
      movies,
    );

    expect(films.map((f) => f.movie.id)).toEqual(["8", "7"]);
    expect(films.map((f) => f.rank)).toEqual([1, 3]);
  });

  it("excludes films whose performances have all finished", () => {
    const finished = movie({ id: "9", title: "Casablanca", year: "1942" });
    finished.performances = [
      { showingId: "9-s", time: new Date("2000-01-01").getTime() },
    ] as Movie["performances"];

    const films = filmsFor(
      curatedList([{ rank: 1, title: "Casablanca", year: 1942 }]),
      record([finished]),
    );

    expect(films).toHaveLength(0);
  });
});

describe("the 100% Club", () => {
  const hundredPercentClub = MOVIE_LISTS.find(
    (list) => list.id === "rt-100-percent-club",
  )!;

  const withScore = (
    id: string,
    title: string,
    score: number,
    reviews: number,
  ) =>
    movie({
      id,
      title,
      rottenTomatoes: {
        critics: { all: { score, reviews } },
      } as Movie["rottenTomatoes"],
    });

  it("includes a perfect score backed by enough reviews", () => {
    const movies = record([withScore("10", "Universally Loved", 100, 120)]);
    expect(filmsFor(hundredPercentClub, movies)).toHaveLength(1);
  });

  it("excludes a perfect score from too few reviews", () => {
    const movies = record([withScore("11", "Barely Reviewed", 100, 3)]);
    expect(filmsFor(hundredPercentClub, movies)).toHaveLength(0);
  });

  it("excludes a near-perfect score", () => {
    const movies = record([withScore("12", "Very Nearly", 99, 200)]);
    expect(filmsFor(hundredPercentClub, movies)).toHaveLength(0);
  });

  it("puts the most-reviewed perfect scores first", () => {
    const movies = record([
      withScore("13", "Fewer Reviews", 100, 50),
      withScore("14", "More Reviews", 100, 250),
    ]);

    expect(filmsFor(hundredPercentClub, movies).map((f) => f.movie.id)).toEqual(
      ["14", "13"],
    );
  });
});

describe("getMovieListsForMovie", () => {
  it("reports every registered list a film is on, with its rank", () => {
    const movies = record([
      movie({
        id: "15",
        title: "The Godfather",
        year: "1972",
        rottenTomatoes: {
          url: "{102}the_godfather",
          critics: { all: { score: 100, reviews: 200 } },
        } as Movie["rottenTomatoes"],
      }),
    ]);

    const byId = Object.fromEntries(
      getMovieListsForMovie("15", movies).map((m) => [m.id, m]),
    );

    expect(byId["rt-best-of-all-time"]?.rank).toBe(1);
    expect(byId["rt-100-percent-club"]).toBeDefined();
    expect(byId["rt-100-percent-club"]?.rank).toBeUndefined();
  });

  it("returns nothing for a film on no lists", () => {
    const movies = record([movie({ id: "16", title: "Obscure Local Short" })]);
    expect(getMovieListsForMovie("16", movies)).toEqual([]);
  });
});
