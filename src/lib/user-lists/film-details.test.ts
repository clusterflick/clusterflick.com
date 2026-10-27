import { describe, expect, it } from "vitest";
import {
  collectFilmDetails,
  FILM_DETAILS_CAST_LIMIT,
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
