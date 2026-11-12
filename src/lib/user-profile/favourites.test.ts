import { describe, expect, test } from "vitest";
import { readFavourites, sameFavourites, toFavouriteFilm } from "./favourites";

const film = (n: number) => ({
  id: String(100 + n),
  title: `Film ${n}`,
  year: "2001",
  posterPath: `/poster-${n}.jpg`,
});

describe("toFavouriteFilm", () => {
  test("keeps what can be drawn", () => {
    expect(
      toFavouriteFilm("101", {
        title: " Heat ",
        year: "1995",
        posterPath: "/h.jpg",
      }),
    ).toEqual({ id: "101", title: "Heat", year: "1995", posterPath: "/h.jpg" });
  });

  test("leaves off a year or poster that doesn't fit, keeping the film", () => {
    expect(
      toFavouriteFilm("a1b2c3d4", {
        title: "Untitled",
        year: "c. 1920",
        posterPath: "https://example.com/p.jpg",
      }),
    ).toEqual({ id: "a1b2c3d4", title: "Untitled" });
  });

  test.each([
    ["10/1", "Film"],
    ["101", "   "],
    ["101", "a".repeat(301)],
  ])("%j %j is no favourite", (id, title) => {
    expect(toFavouriteFilm(id, { title })).toBeNull();
  });
});

describe("readFavourites", () => {
  test("keeps the order, drops what can't be drawn and repeats", () => {
    expect(
      readFavourites([film(3), { id: "x/y", title: "Bad" }, film(1), film(3)]),
    ).toEqual([film(3), film(1)]);
  });

  test("stops at four", () => {
    expect(readFavourites([1, 2, 3, 4, 5].map(film))).toEqual(
      [1, 2, 3, 4].map(film),
    );
  });

  test("anything but a list is none", () => {
    expect(readFavourites({ 0: film(1) })).toEqual([]);
    expect(readFavourites(undefined)).toEqual([]);
  });
});

describe("sameFavourites", () => {
  test("compares by film and order", () => {
    expect(sameFavourites([film(1), film(2)], [film(1), film(2)])).toBe(true);
    expect(sameFavourites([film(1), film(2)], [film(2), film(1)])).toBe(false);
    expect(sameFavourites([], undefined)).toBe(true);
  });
});
