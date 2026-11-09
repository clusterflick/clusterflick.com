import { describe, expect, it } from "vitest";
import {
  MOVIE_LISTS,
  MovieListSource,
  type MovieList,
} from "@/data/movie-lists";
import { getMovieListTmdbIds } from "./get-movie-list-tmdb-ids";

const curated = (entries: { tmdbId: string | null }[]): MovieList => ({
  id: "test",
  name: "Test",
  badgeLabel: "Test",
  aliases: [],
  kind: "curated",
  source: MovieListSource.Editorial,
  sourceName: "Test",
  sourceUrl: "https://example.com",
  description: "",
  entries: entries.map((entry, i) => ({ title: `Film ${i}`, ...entry })),
});

describe("getMovieListTmdbIds", () => {
  it("lists each film once, leaving out entries with no TMDB film", () => {
    expect(
      getMovieListTmdbIds(
        curated([
          { tmdbId: "1891" },
          { tmdbId: null },
          { tmdbId: "1891" },
          { tmdbId: "11" },
        ]),
      ),
    ).toEqual(["1891", "11"]);
  });

  it("has none for a computed list", () => {
    const computed = MOVIE_LISTS.find((list) => list.kind === "computed")!;
    expect(getMovieListTmdbIds(computed)).toEqual([]);
  });
});
