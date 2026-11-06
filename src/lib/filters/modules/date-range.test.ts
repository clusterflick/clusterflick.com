import { afterEach, describe, expect, it, vi } from "vitest";
import type { MoviesRecord } from "../types";
import { dateStringToLondonTimestamp } from "@/utils/format-date";
import { getDefaultState } from "../manager";
import { dateRangeFilter } from "./date-range";

const movieWith = (times: number[]): MoviesRecord =>
  ({
    m: {
      id: "m",
      title: "Clayface",
      showings: { s: { id: "s", venueId: "v" } },
      performances: times.map((time) => ({ showingId: "s", time })),
    },
  }) as unknown as MoviesRecord;

const keptTimes = (movies: MoviesRecord) =>
  Object.values(movies).flatMap((movie) =>
    movie.performances.map((p) => p.time),
  );

describe("dateRangeFilter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the last evening of the next 7 days when the clocks go back in between", () => {
    vi.useFakeTimers();
    // Thursday 22 October 2026, BST; the clocks go back on Sunday 25th.
    vi.setSystemTime(Date.parse("2026-10-22T12:00:00Z"));

    const lastNight = Date.parse("2026-10-29T23:05:00Z"); // 23:05 GMT, 29th
    const dayAfter = Date.parse("2026-10-30T00:05:00Z"); // 00:05 GMT, 30th
    const state = getDefaultState();

    expect(dateRangeFilter.get(state)?.end).toBe(
      dateStringToLondonTimestamp("2026-10-29"),
    );
    expect(
      keptTimes(dateRangeFilter.apply(movieWith([lastNight, dayAfter]), state)),
    ).toEqual([lastNight]);
  });

  it("round-trips the default range through the address", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2026-10-22T12:00:00Z"));

    const range = {
      start: dateStringToLondonTimestamp("2026-10-22"),
      end: dateStringToLondonTimestamp("2026-10-30"),
    };
    const params = new URLSearchParams();
    dateRangeFilter.toUrlParams(
      dateRangeFilter.set(getDefaultState(), range),
      params,
    );
    expect(params.get("dateEnd")).toBe("2026-10-30");
    expect(dateRangeFilter.fromUrlParams(params)).toEqual(range);
  });
});
