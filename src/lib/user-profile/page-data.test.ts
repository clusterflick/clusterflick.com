import { describe, expect, test } from "vitest";
import { parseProfilePageData } from "./page-data";

/** A value as Firestore's REST API sends it, as the SDK would have stored it. */
function encode(value: unknown): Record<string, unknown> {
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(encode) } };
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value as object).map(([k, v]) => [k, encode(v)]),
      ),
    },
  };
}

const ROOT = "projects/clusterflick-com/databases/(default)/documents";

/** The Worker's script tag for a found profile, its documents as Firestore sent them. */
function found(
  user: Record<string, unknown> | null,
  films: Record<string, unknown> | null,
) {
  const document = (path: string, data: Record<string, unknown> | null) =>
    data
      ? {
          found: {
            name: `${ROOT}/${path}`,
            fields: (encode(data).mapValue as { fields: unknown }).fields,
          },
          readTime: "2026-11-12T00:00:00Z",
        }
      : { missing: `${ROOT}/${path}`, readTime: "2026-11-12T00:00:00Z" };
  return JSON.stringify({
    found: true,
    handle: "film-fan",
    // In no particular order.
    documents: [
      document("users/-/meta/films", films),
      document("users/-", user),
    ],
  });
}

describe("parseProfilePageData", () => {
  test("decodes the lists, venues and film details as the Worker sends them", () => {
    const data = parseProfilePageData(
      found(
        {
          seen: {
            "1": {
              title: "Dune",
              year: "2021",
              posterPath: "/d.jpg",
              addedAt: 5,
            },
          },
          watchlist: { "2": { title: "Heat", addedAt: 7 } },
          favouriteVenues: { rio: { name: "The Rio", addedAt: 3 } },
        },
        {
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
      ),
    );
    expect(data).toEqual({
      found: true,
      handle: "film-fan",
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

  test("missing documents and fields are empty", () => {
    expect(parseProfilePageData(found(null, null))).toEqual({
      found: true,
      handle: "film-fan",
      lists: { seen: {}, watchlist: {} },
      favouriteVenues: {},
      filmDetails: { films: {}, people: {} },
    });
  });

  test("drops entries it can't draw", () => {
    const data = parseProfilePageData(
      found(
        {
          seen: { "1": { year: "2001" }, "2": { title: "Heat" } },
          favouriteVenues: { rio: { addedAt: 1 } },
        },
        null,
      ),
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
