import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addLondonDays,
  dateStringToLondonTimestamp,
  getDaysFromNow,
  getLondonDaysBetween,
} from "./format-date";

// UK clocks go back at 02:00 BST on 25 October 2026 and forward at 01:00 GMT
// on 29 March 2026.

describe("dateStringToLondonTimestamp", () => {
  it("returns London midnight in summer and winter", () => {
    expect(dateStringToLondonTimestamp("2026-07-01")).toBe(
      Date.parse("2026-06-30T23:00:00Z"),
    );
    expect(dateStringToLondonTimestamp("2026-12-01")).toBe(
      Date.parse("2026-12-01T00:00:00Z"),
    );
  });

  it("returns London midnight on the days the clocks change", () => {
    // Midnight on 25 October is still BST.
    expect(dateStringToLondonTimestamp("2026-10-25")).toBe(
      Date.parse("2026-10-24T23:00:00Z"),
    );
    // Midnight on 29 March is still GMT.
    expect(dateStringToLondonTimestamp("2026-03-29")).toBe(
      Date.parse("2026-03-29T00:00:00Z"),
    );
  });
});

describe("addLondonDays", () => {
  it("lands on London midnight across the clocks going back", () => {
    const start = dateStringToLondonTimestamp("2026-10-22");
    expect(addLondonDays(start, 7)).toBe(
      dateStringToLondonTimestamp("2026-10-29"),
    );
    expect(addLondonDays(start, 7) - start).toBe(
      7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
    );
  });

  it("lands on London midnight across the clocks going forward", () => {
    const start = dateStringToLondonTimestamp("2026-03-26");
    expect(addLondonDays(start, 7)).toBe(
      dateStringToLondonTimestamp("2026-04-02"),
    );
  });

  it("counts from the London date of a time that is not midnight", () => {
    const lateEvening = Date.parse("2026-10-22T22:30:00Z"); // 23:30 BST
    expect(addLondonDays(lateEvening, 1)).toBe(
      dateStringToLondonTimestamp("2026-10-23"),
    );
  });

  it("goes back with a negative count", () => {
    const start = dateStringToLondonTimestamp("2026-10-26");
    expect(addLondonDays(start, -2)).toBe(
      dateStringToLondonTimestamp("2026-10-24"),
    );
  });
});

describe("getLondonDaysBetween", () => {
  it("counts calendar days across a 25-hour day", () => {
    const from = dateStringToLondonTimestamp("2026-10-22");
    // 23:05 GMT on 29 October, after the clocks went back.
    expect(getLondonDaysBetween(from, Date.parse("2026-10-29T23:05:00Z"))).toBe(
      7,
    );
  });

  it("counts calendar days across a 23-hour day", () => {
    const from = dateStringToLondonTimestamp("2026-03-26");
    // 00:30 BST on 30 March is 23:30 UTC on the 29th.
    expect(getLondonDaysBetween(from, Date.parse("2026-03-29T23:30:00Z"))).toBe(
      4,
    );
  });
});

describe("getDaysFromNow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts a showing just after midnight across the clocks going forward", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2026-03-26T12:00:00Z"));
    expect(getDaysFromNow(Date.parse("2026-03-29T23:30:00Z"))).toBe(4);
  });
});
