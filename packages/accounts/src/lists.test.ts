import { describe, expect, it } from "vitest";
import type { Value } from "./firestore";
import { readFavouriteVenues, readFilmDetails, readList } from "./lists";

/** A plain value as Firestore's REST API sends it. */
function encode(value: unknown): Value {
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

describe("readList", () => {
  it("reads each entry, with what it has", () => {
    expect(
      readList(
        encode({
          m1: {
            title: "Halloween",
            year: "1978",
            posterPath: "/p.jpg",
            addedAt: 5,
          },
          m2: { title: "Cléo from 5 to 7" },
        }),
      ),
    ).toEqual({
      m1: {
        title: "Halloween",
        year: "1978",
        posterPath: "/p.jpg",
        addedAt: 5,
      },
      m2: { title: "Cléo from 5 to 7", addedAt: 0 },
    });
  });

  it("drops an entry with no title, and reads anything else as empty", () => {
    expect(readList(encode({ m1: { year: "1978" }, m2: "x" }))).toEqual({});
    expect(readList(undefined)).toEqual({});
    expect(readList(encode("x"))).toEqual({});
  });
});

describe("readFavouriteVenues", () => {
  it("reads named venues and drops the rest", () => {
    expect(
      readFavouriteVenues(
        encode({ rio: { name: "Rio Cinema", addedAt: 3 }, x: { addedAt: 1 } }),
      ),
    ).toEqual({ rio: { name: "Rio Cinema", addedAt: 3 } });
  });
});

describe("readFilmDetails", () => {
  it("keeps the Seen list's films, and only the people credited on them", () => {
    const seen = readList(encode({ m1: { title: "Halloween" } }));
    expect(
      readFilmDetails(
        encode({
          m1: {
            genres: ["horror"],
            directors: ["p1"],
            cast: ["p2"],
            runtime: 91,
            language: "en",
          },
          m9: { genres: ["drama"], directors: ["p3"], cast: [] },
        }),
        encode({
          p1: "John Carpenter",
          p2: "Jamie Lee Curtis",
          p3: "Someone Else",
        }),
        seen,
      ),
    ).toEqual({
      films: {
        m1: {
          genres: ["horror"],
          directors: ["p1"],
          cast: ["p2"],
          runtime: 91,
          language: "en",
        },
      },
      people: { p1: "John Carpenter", p2: "Jamie Lee Curtis" },
    });
  });
});
