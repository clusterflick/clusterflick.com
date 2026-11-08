import { describe, expect, it } from "vitest";
import {
  buildDetailsDocument,
  getListedIds,
  isSameDocument,
  isTmdbId,
  trimTmdbMovie,
} from "./film-details-migration";

const heat = {
  genres: ["80", "18"],
  directors: [{ id: "638", name: "Michael Mann" }],
  cast: [
    { id: "1158", name: "Al Pacino" },
    { id: "380", name: "Robert De Niro" },
  ],
  runtime: 170,
  language: "en",
};

describe("isTmdbId", () => {
  it("takes TMDB's ids and refuses the pipeline's", () => {
    expect(["949", "1600000"].every(isTmdbId)).toBe(true);
    expect(["a1b2c3d4", "12345678", "01234567"].some(isTmdbId)).toBe(false);
  });
});

describe("getListedIds", () => {
  it("is every film on either list, once, and nothing else", () => {
    expect(
      getListedIds({
        watchlist: { 949: {}, 603: {} },
        seen: { 603: {}, 11: {} },
        favouriteVenues: { "venue-1": {} },
      }),
    ).toEqual(new Set(["949", "603", "11"]));
    expect(getListedIds(undefined)).toEqual(new Set());
  });
});

describe("trimTmdbMovie", () => {
  it("reads TMDB as the Worker does", () => {
    expect(
      trimTmdbMovie({
        id: 949,
        genres: [{ id: 80, name: "Crime" }],
        runtime: 170,
        original_language: "en",
        credits: {
          cast: Array.from({ length: 7 }, (_, i) => ({
            id: 100 + i,
            name: `Actor ${i}`,
            order: 6 - i,
          })),
          crew: [
            { id: 2, name: "Lana", job: "Director", credit_id: "b" },
            { id: 9, name: "Writer", job: "Screenplay", credit_id: "a" },
            { id: 1, name: "Lilly", job: "Director", credit_id: "a" },
          ],
        },
      }),
    ).toEqual({
      genres: ["80"],
      directors: [
        { id: "1", name: "Lilly" },
        { id: "2", name: "Lana" },
      ],
      cast: [106, 105, 104, 103, 102].map((id) => ({
        id: String(id),
        name: `Actor ${id - 100}`,
      })),
      runtime: 170,
      language: "en",
    });
  });

  it("leaves out what TMDB doesn't know, as Firestore rejects undefined", () => {
    expect(trimTmdbMovie({ id: 1, runtime: 0 })).toEqual({
      genres: [],
      directors: [],
      cast: [],
    });
  });
});

describe("buildDetailsDocument", () => {
  it("writes ids on each film and names once", () => {
    const { document, withoutDetails } = buildDetailsDocument(
      new Set(["949"]),
      new Map([["949", heat]]),
    );
    expect(document).toEqual({
      films: {
        949: {
          genres: ["80", "18"],
          directors: ["638"],
          cast: ["1158", "380"],
          runtime: 170,
          language: "en",
        },
      },
      people: {
        638: "Michael Mann",
        1158: "Al Pacino",
        380: "Robert De Niro",
      },
    });
    expect(withoutDetails).toEqual([]);
  });

  it("drops films on no list, and the names only they used", () => {
    const stored = {
      films: { 603: { genres: [], directors: ["9"], cast: [] } },
      people: { 9: "Lana" },
    };
    const { document } = buildDetailsDocument(
      new Set(["949"]),
      new Map([["949", heat]]),
      stored,
    );
    expect(document.films).not.toHaveProperty("603");
    expect(document.people).not.toHaveProperty("9");
  });

  it("keeps what's stored for a film it didn't fetch", () => {
    const stored = {
      films: { 1: { genres: ["18"], directors: ["9"], cast: [] } },
      people: { 9: "Lana" },
    };
    const { document } = buildDetailsDocument(
      new Set(["1"]),
      new Map(),
      stored,
    );
    expect(document).toEqual(stored);
  });

  it("lists films with no details: unmatched, or unknown to TMDB", () => {
    const { withoutDetails } = buildDetailsDocument(
      new Set(["a1b2c3d4", "999999"]),
      new Map([["999999", null]]),
    );
    expect(withoutDetails).toEqual(["999999", "a1b2c3d4"]);
  });
});

describe("isSameDocument", () => {
  it("ignores key order but not values", () => {
    expect(
      isSameDocument({ films: { a: 1, b: 2 } }, { films: { b: 2, a: 1 } }),
    ).toBe(true);
    expect(isSameDocument({ films: { a: 1 } }, { films: { a: 2 } })).toBe(
      false,
    );
  });
});
