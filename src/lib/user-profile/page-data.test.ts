import { describe, expect, test } from "vitest";
import { parseProfilePageData } from "./page-data";
import { ALL_PROFILE_SECTIONS } from ".";

/** The Worker's script tag for a found profile, with what it decoded. */
function found(
  content: Record<string, unknown> | null,
  extra: Record<string, unknown> = {},
) {
  return JSON.stringify({
    found: true,
    handle: "film-fan",
    ...extra,
    ...content,
  });
}

describe("parseProfilePageData", () => {
  test("reads the lists, venues and film details as the Worker sends them", () => {
    const data = parseProfilePageData(
      found({
        lists: {
          seen: {
            "1": {
              title: "Dune",
              year: "2021",
              posterPath: "/d.jpg",
              addedAt: 5,
            },
          },
          watchlist: { "2": { title: "Heat", addedAt: 7 } },
        },
        favouriteVenues: { rio: { name: "The Rio", addedAt: 3 } },
        filmDetails: {
          films: {
            "1": {
              genres: ["878"],
              directors: ["137427"],
              cast: ["1190668"],
              runtime: 155,
              language: "en",
            },
          },
          people: { "137427": "Denis Villeneuve" },
        },
      }),
    );
    expect(data).toEqual({
      found: true,
      handle: "film-fan",
      sections: ALL_PROFILE_SECTIONS,
      links: {},
      favourites: [],
      lists: {
        seen: {
          "1": {
            title: "Dune",
            year: "2021",
            posterPath: "/d.jpg",
            addedAt: 5,
          },
        },
        watchlist: { "2": { title: "Heat", addedAt: 7 } },
      },
      favouriteVenues: { rio: { name: "The Rio", addedAt: 3 } },
      filmDetails: {
        films: {
          "1": {
            genres: ["878"],
            directors: ["137427"],
            cast: ["1190668"],
            runtime: 155,
            language: "en",
          },
        },
        people: { "137427": "Denis Villeneuve" },
      },
    });
  });

  test("reads the sections shown, only true showing one", () => {
    const data = parseProfilePageData(
      found(null, {
        sections: { seenStats: true, watchlist: false, seen: "yes" },
      }),
    );
    expect(data.found && data.sections).toEqual({
      seenStats: true,
      watchlist: false,
      favouriteVenues: false,
      seen: false,
    });
  });

  test("reads the name and links, stripping and dropping what can't show", () => {
    const data = parseProfilePageData(
      found(null, {
        displayName: "<Siobhán> O'Brien",
        links: {
          letterboxd: "film_fan",
          website: "javascript:alert(1)",
          imdb: "ur123",
        },
      }),
    );
    expect(data.found && data.displayName).toBe("Siobhán O'Brien");
    expect(data.found && data.links).toEqual({
      letterboxd: "film_fan",
      imdb: "ur123",
    });
  });

  test("reads the favourites in order, dropping what can't be drawn", () => {
    const data = parseProfilePageData(
      found(null, {
        favourites: [
          { id: "949", title: "Heat", year: "1995", posterPath: "/h.jpg" },
          { id: "../x", title: "Bad" },
          { id: "843", title: "In the Mood for Love" },
        ],
      }),
    );
    expect(data.found && data.favourites).toEqual([
      { id: "949", title: "Heat", year: "1995", posterPath: "/h.jpg" },
      { id: "843", title: "In the Mood for Love" },
    ]);
  });

  test("no name is the handle alone", () => {
    const data = parseProfilePageData(found(null, { displayName: "  " }));
    expect(data.found && data).not.toHaveProperty("displayName");
  });

  test("no sections, from a Worker before them, is every section", () => {
    const data = parseProfilePageData(found(null));
    expect(data.found && data.sections).toEqual(ALL_PROFILE_SECTIONS);
  });

  test("missing lists, venues and details are empty", () => {
    expect(parseProfilePageData(found(null))).toEqual({
      found: true,
      handle: "film-fan",
      sections: ALL_PROFILE_SECTIONS,
      links: {},
      favourites: [],
      lists: { seen: {}, watchlist: {} },
      favouriteVenues: {},
      filmDetails: { films: {}, people: {} },
    });
  });

  test("drops entries it can't draw", () => {
    const data = parseProfilePageData(
      found({
        lists: { seen: { "1": { year: "2001" }, "2": { title: "Heat" } } },
        favouriteVenues: { rio: { addedAt: 1 } },
        filmDetails: "not details",
      }),
    );
    expect(data.found && data.lists.seen).toEqual({
      "2": { title: "Heat", addedAt: 0 },
    });
    expect(data.found && data.favouriteVenues).toEqual({});
  });

  test("no script tag, or anything unreadable, is not found", () => {
    expect(parseProfilePageData(null)).toEqual({ found: false });
    expect(parseProfilePageData("{")).toEqual({ found: false });
    expect(parseProfilePageData("[]")).toEqual({ found: false });
  });

  test("keeps a not-found page's handle, when it's a valid one", () => {
    expect(parseProfilePageData('{"found":false,"handle":"film-fan"}')).toEqual(
      { found: false, handle: "film-fan" },
    );
    expect(parseProfilePageData('{"found":false,"handle":"Bad!"}')).toEqual({
      found: false,
    });
  });

  test("a found profile without a valid handle is not found", () => {
    expect(parseProfilePageData('{"found":true,"handle":"x"}')).toEqual({
      found: false,
    });
  });
});
