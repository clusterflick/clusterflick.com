import { describe, expect, it } from "vitest";
import {
  isLetterboxdId,
  isLetterboxdUsername,
  MAX_LETTERBOXD_RUNS,
  parseLetterboxdLedger,
  parseLetterboxdLink,
  toLetterboxdLinkDocument,
} from "./letterboxd";

describe("isLetterboxdUsername", () => {
  it("takes Letterboxd's documented usernames", () => {
    expect(isLetterboxdUsername("film_fan")).toBe(true);
    expect(isLetterboxdUsername("ab")).toBe(true);
    expect(isLetterboxdUsername("a".repeat(15))).toBe(true);
  });

  it("refuses anything else before it's sent anywhere", () => {
    expect(isLetterboxdUsername("a")).toBe(false);
    expect(isLetterboxdUsername("a".repeat(16))).toBe(false);
    expect(isLetterboxdUsername("film-fan")).toBe(false);
    expect(isLetterboxdUsername("../me")).toBe(false);
    expect(isLetterboxdUsername(undefined)).toBe(false);
  });
});

describe("isLetterboxdId", () => {
  it("is short and alphanumeric", () => {
    expect(isLetterboxdId("1Qma")).toBe(true);
    expect(isLetterboxdId("1Q/a")).toBe(false);
    expect(isLetterboxdId("")).toBe(false);
  });
});

describe("parseLetterboxdLink", () => {
  const link = { username: "film_fan", memberId: "1Qma", linkedAt: 5 };

  it("reads the link the Worker wrote", () => {
    expect(parseLetterboxdLink(toLetterboxdLinkDocument(link))).toEqual(link);
  });

  it("is null without one, or with one it can't read", () => {
    expect(parseLetterboxdLink(null)).toBeNull();
    expect(parseLetterboxdLink({ ...link })).toBeNull();
    expect(
      parseLetterboxdLink({ ...link, enabled: true, memberId: "../x" }),
    ).toBeNull();
    expect(
      parseLetterboxdLink({ ...link, enabled: true, linkedAt: "5" }),
    ).toBeNull();
  });
});

describe("parseLetterboxdLedger", () => {
  it("has no runs before the first", () => {
    expect(parseLetterboxdLedger(undefined)).toEqual({
      runs: [],
      unmatched: [],
    });
  });

  it("reads runs newest first, dropping what it can't read", () => {
    const ledger = parseLetterboxdLedger({
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
    expect(parseLetterboxdLedger({ runs }).runs).toHaveLength(
      MAX_LETTERBOXD_RUNS,
    );
  });

  it("reads the films that couldn't be added", () => {
    const film = {
      list: "seen",
      name: "A Short",
      year: 2020,
      url: "https://letterboxd.com/film/a-short/",
      reason: "noTmdbFilm",
    };
    expect(
      parseLetterboxdLedger({
        unmatched: [
          film,
          { ...film, reason: "unknown" },
          { ...film, list: "x" },
        ],
      }).unmatched,
    ).toEqual([film]);
  });
});
