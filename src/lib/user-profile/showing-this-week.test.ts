import { describe, expect, test } from "vitest";
import type { Movie } from "@/types";
import { getShowingThisWeek } from "./showing-this-week";

const NOW = Date.UTC(2026, 10, 12, 12);
const DAY = 24 * 60 * 60 * 1000;

const movie = (
  ...performances: { time: number; status?: { soldOut?: boolean } }[]
) => ({ performances }) as unknown as Movie;

describe("getShowingThisWeek", () => {
  test("keeps films with a bookable showing in the next seven days", () => {
    const movies = {
      soon: movie({ time: NOW + DAY }),
      later: movie({ time: NOW + 8 * DAY }),
      past: movie({ time: NOW - DAY }),
      soldOut: movie({ time: NOW + DAY, status: { soldOut: true } }),
      mixed: movie(
        { time: NOW + DAY, status: { soldOut: true } },
        { time: NOW + 2 * DAY },
      ),
    };
    expect(
      getShowingThisWeek(
        movies,
        ["mixed", "later", "soon", "past", "soldOut", "gone"],
        NOW,
      ),
    ).toEqual(["mixed", "soon"]);
  });
});
