import { describe, expect, test } from "vitest";
import { parseProfilePageData } from "./page-data";

describe("parseProfilePageData", () => {
  test("reads a found profile as the Worker sends it", () => {
    const data = {
      found: true,
      handle: "film-fan",
      seen: {
        count: 412,
        films: [{ id: "1", title: "Dune", year: "2021", posterPath: "/d.jpg" }],
      },
      watchlist: { count: 0, films: [] },
    };
    expect(parseProfilePageData(JSON.stringify(data))).toEqual(data);
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

  test("drops films it can't draw, and missing lists are empty", () => {
    const data = parseProfilePageData(
      JSON.stringify({
        found: true,
        handle: "film-fan",
        seen: { count: 3, films: [{ id: "1" }, { id: "2", title: "Heat" }] },
      }),
    );
    expect(data).toEqual({
      found: true,
      handle: "film-fan",
      seen: { count: 3, films: [{ id: "2", title: "Heat" }] },
      watchlist: { count: 0, films: [] },
    });
  });
});
