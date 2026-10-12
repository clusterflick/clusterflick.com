import { describe, it, expect } from "vitest";
import type { Movie } from "@/types";
import { genresFilter } from "@/lib/filters/modules/genres";
import { directorsFilter } from "@/lib/filters/modules/people";
import type { FilterState } from "@/lib/filters/types";
import { getMovieAndIncluded } from "./get-movie-and-included";

const UNCATEGORISED = "uncategorised";

const film = (overrides: Partial<Movie>): Movie => ({
  id: "1",
  title: "Film",
  normalizedTitle: "film",
  showings: {},
  performances: [],
  ...overrides,
});

// An unmatched double bill: no genres of its own beyond the placeholder.
const doubleBill = film({
  id: "double",
  title: "Horror Double Bill",
  isUnmatched: true,
  genres: [UNCATEGORISED],
  includedMovies: [
    { id: "a", title: "Halloween", genres: ["27"], directors: ["carpenter"] },
    { id: "b", title: "Scream", genres: ["27", "9648"], directors: ["craven"] },
  ],
});

describe("getMovieAndIncluded", () => {
  it("returns a film's own list when it screens nothing else", () => {
    const movie = film({ genres: ["18"] });
    expect(getMovieAndIncluded(movie, "genres")).toBe(movie.genres);
  });

  it("reads an unmatched event's genres from its films, dropping the placeholder", () => {
    expect(getMovieAndIncluded(doubleBill, "genres")).toEqual(["27", "9648"]);
  });

  it("keeps an unmatched event Uncategorised when its films have no genres", () => {
    const shorts = film({
      isUnmatched: true,
      genres: [UNCATEGORISED],
      includedMovies: [{ id: "s", title: "A Short" }],
    });
    expect(getMovieAndIncluded(shorts, "genres")).toEqual([UNCATEGORISED]);
  });

  it("adds the included films' credits to a matched film's own", () => {
    const movie = film({
      directors: ["lynch"],
      includedMovies: [{ id: "a", title: "Short", directors: ["lynch", "x"] }],
    });
    expect(getMovieAndIncluded(movie, "directors")).toEqual(["lynch", "x"]);
  });
});

describe("filters reading included films", () => {
  const movies = { [doubleBill.id]: doubleBill };

  it("matches a double bill by a genre one of its films has", () => {
    const state = { genres: ["9648"] } as FilterState;
    expect(Object.keys(genresFilter.apply(movies, state))).toEqual(["double"]);
  });

  it("no longer files a double bill with genred films as Uncategorised", () => {
    const state = { genres: [UNCATEGORISED] } as FilterState;
    expect(genresFilter.apply(movies, state)).toEqual({});
  });

  it("matches a double bill by the director of one of its films", () => {
    const state = { directors: ["craven"] } as FilterState;
    expect(Object.keys(directorsFilter.apply(movies, state))).toEqual([
      "double",
    ]);
  });
});
