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
  it("matches each entry by its TMDB id, whatever the titles say", () => {
    const movies = record([
      movie({ id: "238", title: "Renamed Locally", year: "1980" }),
    ]);

    const films = filmsFor(
      curatedList([
        { rank: 1, title: "The Godfather", year: 1972, tmdbId: "238" },
      ]),
      movies,
    );

    expect(films).toHaveLength(1);
    expect(films[0].movie.id).toBe("238");
    expect(films[0].rank).toBe(1);
  });

  it("never matches by title, nor an entry TMDB has no film for", () => {
    const movies = record([
      movie({
        id: "unmatched-1",
        title: "The Sorrow and the Pity",
        year: "1969",
      }),
    ]);

    const films = filmsFor(
      curatedList([
        { rank: 1, title: "The Sorrow and the Pity", year: 1969, tmdbId: null },
      ]),
      movies,
    );

    expect(films).toHaveLength(0);
  });

  it("keeps published order and skips films that aren't showing", () => {
    const movies = record([
      movie({ id: "289", title: "Casablanca", year: "1942" }),
      movie({ id: "829", title: "Chinatown", year: "1974" }),
    ]);

    const films = filmsFor(
      curatedList([
        { rank: 1, title: "Chinatown", year: 1974, tmdbId: "829" },
        { rank: 2, title: "Not Showing Anywhere", year: 1990, tmdbId: "1" },
        { rank: 3, title: "Casablanca", year: 1942, tmdbId: "289" },
      ]),
      movies,
    );

    expect(films.map((f) => f.movie.id)).toEqual(["829", "289"]);
    expect(films.map((f) => f.rank)).toEqual([1, 3]);
  });

  it("lists a film once when two entries share its id", () => {
    const movies = record([
      movie({ id: "1891", title: "The Empire Strikes Back" }),
    ]);

    const films = filmsFor(
      curatedList([
        { rank: 1, title: "Star Wars: Episode V", tmdbId: "1891" },
        { rank: 2, title: "The Empire Strikes Back", tmdbId: "1891" },
      ]),
      movies,
    );

    expect(films.map((f) => f.rank)).toEqual([1]);
  });

  it("excludes films whose performances have all finished", () => {
    const finished = movie({ id: "289", title: "Casablanca", year: "1942" });
    finished.performances = [
      { showingId: "289-s", time: new Date("2000-01-01").getTime() },
    ] as Movie["performances"];

    const films = filmsFor(
      curatedList([
        { rank: 1, title: "Casablanca", year: 1942, tmdbId: "289" },
      ]),
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
    // The Rotten Tomatoes list's #1, by the id the list gives it.
    const rt = MOVIE_LISTS.find(({ id }) => id === "rt-best-of-all-time");
    const first = rt?.kind === "curated" ? rt.entries[0] : undefined;
    const id = first?.tmdbId as string;
    const movies = record([
      movie({
        id,
        title: "The Godfather",
        year: "1972",
        rottenTomatoes: {
          url: "{102}the_godfather",
          critics: { all: { score: 100, reviews: 200 } },
        } as Movie["rottenTomatoes"],
      }),
    ]);

    const byId = Object.fromEntries(
      getMovieListsForMovie(id, movies).map((m) => [m.id, m]),
    );

    expect(byId["rt-best-of-all-time"]?.rank).toBe(1);
    expect(byId["rt-100-percent-club"]).toBeDefined();
    expect(byId["rt-100-percent-club"]?.rank).toBeUndefined();
  });

  it("returns nothing for a film on no lists", () => {
    // Not a TMDB id: the lists hold real ones, and "16" is on one now.
    const movies = record([
      movie({ id: "obscure-short", title: "Obscure Local Short" }),
    ]);
    expect(getMovieListsForMovie("obscure-short", movies)).toEqual([]);
  });
});
