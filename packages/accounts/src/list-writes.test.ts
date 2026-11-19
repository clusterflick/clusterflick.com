import { describe, expect, it } from "vitest";
import { addToLists, isTmdbId, type FilmToAdd } from "./list-writes";

const film = (id: string, title = `Film ${id}`): FilmToAdd => ({
  id,
  entry: { title, year: "1995", posterPath: `/${id}.jpg`, addedAt: 10 },
  details: {
    genres: ["18"],
    directors: ["1"],
    cast: ["2"],
    runtime: 120,
    language: "en",
  },
  people: { "1": "A Director", "2": "An Actor" },
});

describe("isTmdbId", () => {
  it("is TheMovieDB's ids, never the pipeline's own", () => {
    expect(isTmdbId("949")).toBe(true);
    expect(isTmdbId("12345678")).toBe(false);
    expect(isTmdbId("0949")).toBe(false);
    expect(isTmdbId("a1b2c3d4")).toBe(false);
  });
});

describe("addToLists", () => {
  it("adds films with their details", () => {
    const write = addToLists(null, null, { watchlist: [film("949")] });
    expect(write.added).toEqual({ watchlist: ["949"], seen: [] });
    expect(write.lists).toEqual({
      watchlist: {
        "949": {
          title: "Film 949",
          year: "1995",
          posterPath: "/949.jpg",
          addedAt: 10,
        },
      },
    });
    expect(write.details).toEqual({
      films: {
        "949": {
          genres: ["18"],
          directors: ["1"],
          cast: ["2"],
          runtime: 120,
          language: "en",
        },
      },
      people: { "1": "A Director", "2": "An Actor" },
    });
  });

  it("leaves a listed film's entry as it was", () => {
    const stored = { title: "Heat", addedAt: 1 };
    const write = addToLists({ watchlist: { "949": stored } }, null, {
      watchlist: [film("949")],
    });
    expect(write.added.watchlist).toEqual([]);
    expect(write.lists).toEqual({});
    expect(write.details).toBeNull();
  });

  it("keeps everything already stored, even what the site can't read", () => {
    const user = {
      watchlist: { "1": { title: "Old", addedAt: 1 }, "2": { odd: true } },
      seen: { "3": { title: "Seen", addedAt: 2 } },
      favouriteVenues: { v: { name: "A Venue", addedAt: 3 } },
    };
    const films = {
      films: { "1": { genres: [], directors: [], cast: [] } },
      people: { "9": "Someone" },
    };
    const write = addToLists(user, films, { watchlist: [film("949")] });
    expect(write.lists.watchlist).toEqual({
      ...user.watchlist,
      "949": expect.objectContaining({ title: "Film 949" }),
    });
    expect(write.lists.seen).toBeUndefined();
    expect(write.details?.films).toHaveProperty("1");
    expect(write.details?.people).toHaveProperty("9", "Someone");
  });

  it("adds a film to both lists, taking it off neither", () => {
    const write = addToLists(
      { watchlist: { "949": { title: "Heat", addedAt: 1 } } },
      null,
      { seen: [film("949")] },
    );
    expect(write.added).toEqual({ watchlist: [], seen: ["949"] });
    expect(write.lists.watchlist).toBeUndefined();
  });

  describe("seenLeavesWatchlist", () => {
    const onWatchlist = {
      watchlist: {
        "949": { title: "Heat", addedAt: 1 },
        "680": { title: "Pulp Fiction", addedAt: 2 },
      },
    };

    it("takes a film newly added to Seen off the watchlist", () => {
      const write = addToLists(
        onWatchlist,
        null,
        { seen: [film("949")] },
        { seenLeavesWatchlist: () => true },
      );
      expect(write.added.seen).toEqual(["949"]);
      expect(write.removed.watchlist).toEqual(["949"]);
      expect(write.lists.watchlist).toEqual({
        "680": { title: "Pulp Fiction", addedAt: 2 },
      });
      // Its details are saved with the add, and stay.
      expect(write.details?.films).toHaveProperty("949");
    });

    it("leaves it when the caller says it stays", () => {
      const write = addToLists(
        onWatchlist,
        null,
        { seen: [film("949")] },
        { seenLeavesWatchlist: (id) => id !== "949" },
      );
      expect(write.removed.watchlist).toEqual([]);
      expect(write.lists.watchlist).toBeUndefined();
    });

    it("never takes off a film that was already in Seen", () => {
      const write = addToLists(
        { ...onWatchlist, seen: { "949": { title: "Heat", addedAt: 0 } } },
        null,
        { seen: [film("949")] },
        { seenLeavesWatchlist: () => true },
      );
      expect(write.added.seen).toEqual([]);
      expect(write.removed.watchlist).toEqual([]);
      expect(write.lists).toEqual({});
    });

    it("keeps a film added to both lists in the same write", () => {
      const write = addToLists(
        null,
        null,
        { watchlist: [film("949")], seen: [film("949")] },
        { seenLeavesWatchlist: () => true },
      );
      expect(write.added).toEqual({ watchlist: ["949"], seen: ["949"] });
      expect(write.removed.watchlist).toEqual([]);
      expect(write.lists.watchlist).toHaveProperty("949");
    });

    it("takes nothing off by default", () => {
      const write = addToLists(onWatchlist, null, { seen: [film("949")] });
      expect(write.removed.watchlist).toEqual([]);
      expect(write.lists.watchlist).toBeUndefined();
    });
  });

  it("leaves out fields a film doesn't have", () => {
    const bare: FilmToAdd = {
      id: "7",
      entry: { title: "Bare", addedAt: 1 },
      details: { genres: [], directors: [], cast: [] },
      people: {},
    };
    const write = addToLists(null, null, { seen: [bare] });
    expect(write.lists.seen).toEqual({ "7": { title: "Bare", addedAt: 1 } });
    expect(write.details?.films).toEqual({
      "7": { genres: [], directors: [], cast: [] },
    });
  });

  it("refuses a film without what the site needs, writing nothing", () => {
    expect(() => addToLists(null, null, { seen: [film("a1b2c3d4")] })).toThrow(
      /TheMovieDB/,
    );
    expect(() =>
      addToLists(null, null, { seen: [{ ...film("1"), people: {} }] }),
    ).toThrow(/no name/);
    expect(() => addToLists(null, null, { seen: [film("1", "")] })).toThrow(
      /no title/,
    );
  });

  it("refuses to write over a list that isn't a map", () => {
    expect(() =>
      addToLists({ watchlist: ["949"] }, null, { watchlist: [film("1")] }),
    ).toThrow(/isn't a map/);
  });
});
