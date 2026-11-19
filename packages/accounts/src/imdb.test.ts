import { describe, expect, it } from "vitest";
import {
  isImdbProfileId,
  isImdbTitleId,
  isImdbUserId,
  MAX_IMDB_RUNS,
  parseImdbLedger,
  parseImdbLink,
  readImdbUser,
  toImdbLinkDocument,
} from "./imdb";

describe("IMDb ids", () => {
  it("takes both forms of user id", () => {
    expect(isImdbUserId("ur240131748")).toBe(true);
    expect(isImdbProfileId("p.mbd2yexnoms6latfrdkzba2zxy")).toBe(true);
  });

  it("refuses anything else before it's sent anywhere", () => {
    expect(isImdbUserId("ur")).toBe(false);
    expect(isImdbUserId("ur12a")).toBe(false);
    expect(isImdbUserId("p.abc")).toBe(false);
    expect(isImdbProfileId("p.ABC")).toBe(false);
    expect(isImdbProfileId("p.")).toBe(false);
    expect(isImdbProfileId("p.a/b")).toBe(false);
    expect(isImdbUserId(undefined)).toBe(false);
  });

  it("knows a title id", () => {
    expect(isImdbTitleId("tt0133093")).toBe(true);
    expect(isImdbTitleId("nm0000206")).toBe(false);
  });
});

describe("readImdbUser", () => {
  it("reads an id on its own", () => {
    expect(readImdbUser("ur240131748")).toBe("ur240131748");
    expect(readImdbUser(" p.mbd2yexnoms6latfrdkzba2zxy ")).toBe(
      "p.mbd2yexnoms6latfrdkzba2zxy",
    );
  });

  it("reads one from a profile's address", () => {
    expect(
      readImdbUser(
        "https://www.imdb.com/user/p.mbd2yexnoms6latfrdkzba2zxy/watchlist/",
      ),
    ).toBe("p.mbd2yexnoms6latfrdkzba2zxy");
    expect(readImdbUser("https://m.imdb.com/user/ur240131748/")).toBe(
      "ur240131748",
    );
  });

  it("is null for anything else", () => {
    expect(readImdbUser("alistair")).toBeNull();
    expect(readImdbUser("https://example.com/user/ur240131748/")).toBeNull();
    expect(readImdbUser("https://www.imdb.com/title/tt0133093/")).toBeNull();
    expect(readImdbUser("https://www.imdb.com/user/../")).toBeNull();
    expect(readImdbUser(5)).toBeNull();
  });
});

describe("parseImdbLink", () => {
  const link = {
    userId: "ur240131748",
    profileId: "p.mbd2yexnoms6latfrdkzba2zxy",
    username: "film_fan",
    linkedAt: 5,
  };

  it("reads the link the Worker wrote", () => {
    expect(parseImdbLink(toImdbLinkDocument(link))).toEqual(link);
    const nameless = {
      userId: link.userId,
      profileId: link.profileId,
      linkedAt: link.linkedAt,
    };
    expect(parseImdbLink(toImdbLinkDocument(nameless))).toEqual(nameless);
  });

  it("is null without one, or with one it can't read", () => {
    expect(parseImdbLink(null)).toBeNull();
    expect(parseImdbLink({ ...link })).toBeNull();
    expect(
      parseImdbLink({ ...link, enabled: true, userId: "../x" }),
    ).toBeNull();
    expect(
      parseImdbLink({ ...link, enabled: true, profileId: "ur1" }),
    ).toBeNull();
    expect(parseImdbLink({ ...link, enabled: true, linkedAt: "5" })).toBeNull();
  });

  it("drops a username it can't show", () => {
    expect(
      parseImdbLink({ ...link, enabled: true, username: "x".repeat(101) }),
    ).not.toHaveProperty("username");
  });
});

describe("parseImdbLedger", () => {
  it("has no runs before the first", () => {
    expect(parseImdbLedger(undefined)).toEqual({ runs: [], unmatched: [] });
  });

  it("reads runs newest first, dropping what it can't read", () => {
    const ledger = parseImdbLedger({
      runs: [
        { on: "2026-11-16", at: 1, outcome: "nothingNew" },
        {
          on: "2026-11-17",
          at: 2,
          outcome: "synced",
          added: { watchlist: 2, seen: 3 },
          remaining: 4,
          watchlistPrivate: true,
        },
        { on: "yesterday", at: 3, outcome: "synced" },
        { on: "2026-11-18", at: 4, outcome: "exploded" },
      ],
    });
    expect(ledger.runs).toEqual([
      {
        on: "2026-11-17",
        at: 2,
        outcome: "synced",
        added: { watchlist: 2, seen: 3 },
        remaining: 4,
        watchlistPrivate: true,
      },
      { on: "2026-11-16", at: 1, outcome: "nothingNew" },
    ]);
  });

  it("keeps at most so many runs", () => {
    const runs = Array.from({ length: 40 }, (_, at) => ({
      on: "2026-11-17",
      at,
      outcome: "nothingNew",
    }));
    expect(parseImdbLedger({ runs }).runs).toHaveLength(MAX_IMDB_RUNS);
  });

  it("reads the films that couldn't be added", () => {
    const film = {
      list: "seen",
      name: "A Short",
      year: 2020,
      imdbId: "tt0000001",
      reason: "noTmdbFilm",
    };
    expect(
      parseImdbLedger({
        unmatched: [
          film,
          { ...film, reason: "unknown" },
          { ...film, list: "x" },
          { ...film, imdbId: "https://www.imdb.com/title/tt0000001/" },
        ],
      }).unmatched,
    ).toEqual([film]);
  });
});
