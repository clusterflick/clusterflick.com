import { describe, expect, it } from "vitest";
import {
  collectFilmDetails,
  FILM_DETAILS_CAST_LIMIT,
  fromTmdbDetails,
  isTmdbId,
  pickFilmDetails,
  type FilmDetailsSource,
} from "./film-details";

const people = {
  "1": { name: "Michael Mann" },
  "2": { name: "Al Pacino" },
  "3": { name: "Robert De Niro" },
  "4": { name: "Val Kilmer" },
  "5": { name: "Jon Voight" },
  "6": { name: "Tom Sizemore" },
  "7": { name: "Diane Venora" },
};

const heat: FilmDetailsSource = {
  id: "949",
  genres: ["80", "18"],
  directors: ["1"],
  actors: ["2", "3", "4", "5", "6", "7"],
  duration: 170 * 60000,
};

describe("collectFilmDetails", () => {
  it("keeps genres, directors, top-billed cast and runtime in minutes", () => {
    expect(collectFilmDetails([heat], people)).toEqual({
      films: {
        "949": {
          genres: ["80", "18"],
          directors: ["1"],
          cast: ["2", "3", "4", "5", "6"],
          runtime: 170,
          language: "en",
        },
      },
      people: {
        "1": "Michael Mann",
        "2": "Al Pacino",
        "3": "Robert De Niro",
        "4": "Val Kilmer",
        "5": "Jon Voight",
        "6": "Tom Sizemore",
      },
    });
    expect(FILM_DETAILS_CAST_LIMIT).toBe(5);
  });

  it("stores each name once across films", () => {
    const insider = { ...heat, id: "9008", actors: ["2"], directors: ["1"] };
    const { people: stored } = collectFilmDetails([heat, insider], people);
    expect(Object.keys(stored)).toHaveLength(6);
  });

  it("keeps the dataset's language, which it names only when not English", () => {
    const film = { ...heat, originalLanguage: "fr" };
    expect(collectFilmDetails([film], people).films["949"].language).toBe("fr");
  });

  it("leaves out a runtime it doesn't know, since Firestore rejects undefined", () => {
    const film = { ...heat, duration: undefined };
    expect(collectFilmDetails([film], people).films["949"]).not.toHaveProperty(
      "runtime",
    );
  });

  it("skips unmatched films, which have no TheMovieDB record", () => {
    const film = { ...heat, isUnmatched: true };
    expect(collectFilmDetails([film], people).films).toEqual({});
  });

  it("leaves off a person the lookup can't name", () => {
    const film = { ...heat, directors: ["1", "999"] };
    const details = collectFilmDetails([film], people);
    expect(details.films["949"].directors).toEqual(["1"]);
    expect(details.people).not.toHaveProperty("999");
  });
});

describe("isTmdbId", () => {
  it.each(["949", "1", "1600000"])("takes %s as TMDB's", (id) => {
    expect(isTmdbId(id)).toBe(true);
  });

  it.each([
    ["a pipeline id", "a1b2c3d4"],
    ["an all-digit pipeline id", "12345678"],
    ["one starting with a zero", "01234567"],
    ["an empty id", ""],
  ])("refuses %s", (_, id) => {
    expect(isTmdbId(id)).toBe(false);
  });
});

describe("fromTmdbDetails", () => {
  it("stores ids on the film and names once", () => {
    expect(
      fromTmdbDetails([
        {
          id: "949",
          genres: ["80"],
          directors: [{ id: "1", name: "Michael Mann" }],
          cast: [{ id: "2", name: "Al Pacino" }],
          runtime: 170,
        },
      ]),
    ).toEqual({
      films: {
        "949": { genres: ["80"], directors: ["1"], cast: ["2"], runtime: 170 },
      },
      people: { "1": "Michael Mann", "2": "Al Pacino" },
    });
  });
});

describe("pickFilmDetails", () => {
  it("keeps the films asked for and only the names they use", () => {
    expect(
      pickFilmDetails(
        {
          films: {
            "949": { genres: [], directors: ["1"], cast: ["2"] },
            "603": { genres: [], directors: ["3"], cast: ["2"] },
          },
          people: { "1": "Michael Mann", "2": "Shared", "3": "Lana" },
        },
        ["949", "unknown"],
      ),
    ).toEqual({
      films: { "949": { genres: [], directors: ["1"], cast: ["2"] } },
      people: { "1": "Michael Mann", "2": "Shared" },
    });
  });
});
