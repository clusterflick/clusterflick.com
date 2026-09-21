import { describe, expect, it } from "vitest";
import type { Movie } from "@/types";
import { dateStringToLondonTimestamp } from "@/utils/format-date";
import {
  clampToRange,
  findNearestShowingDay,
  formatHour,
  getLastShowingDay,
  getPlannerHours,
  getPlannerRange,
  groupBySameStart,
  getPlannerRows,
  getPlannerWeek,
  getShowingDays,
  isDateString,
  shiftDate,
} from "./get-planner-day";

const at = (date: string, hours: number) =>
  dateStringToLondonTimestamp(date) + hours * 60 * 60 * 1000;

const movie = (id: string, title: string, times: number[]): Movie =>
  ({
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    showings: {},
    performances: times.map((time) => ({
      showingId: "s",
      time,
      bookingUrl: "",
    })),
  }) as Movie;

describe("shiftDate", () => {
  it("steps across month and year ends", () => {
    expect(shiftDate("2026-09-30", 1)).toBe("2026-10-01");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDate("2026-10-01", -1)).toBe("2026-09-30");
  });

  it("steps across a clock change without skipping or repeating a day", () => {
    // UK clocks go back on 25 October 2026.
    expect(shiftDate("2026-10-24", 1)).toBe("2026-10-25");
    expect(shiftDate("2026-10-25", 1)).toBe("2026-10-26");
  });
});

describe("isDateString", () => {
  it("accepts real dates only", () => {
    expect(isDateString("2026-09-27")).toBe(true);
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("27-09-2026")).toBe(false);
    expect(isDateString(null)).toBe(false);
  });
});

describe("getPlannerRange", () => {
  const films = [movie("1", "A", [at("2026-09-21", 19), at("2026-10-04", 20)])];

  it("reads an open start as today and an open end as the last showing", () => {
    expect(
      getPlannerRange(films, { start: null, end: null }, "2026-09-21"),
    ).toEqual({ first: "2026-09-21", last: "2026-10-04" });
  });

  it("uses the filter's own bounds when set", () => {
    expect(
      getPlannerRange(
        films,
        {
          start: dateStringToLondonTimestamp("2026-09-22"),
          end: dateStringToLondonTimestamp("2026-09-28"),
        },
        "2026-09-21",
      ),
    ).toEqual({ first: "2026-09-22", last: "2026-09-28" });
  });

  it("is null when nothing is showing", () => {
    expect(
      getPlannerRange([], { start: null, end: null }, "2026-09-21"),
    ).toBeNull();
  });
});

describe("clampToRange", () => {
  const range = { first: "2026-09-21", last: "2026-09-28" };

  it("falls back to the first day, and pins either end", () => {
    expect(clampToRange(null, range)).toBe("2026-09-21");
    expect(clampToRange("2026-09-01", range)).toBe("2026-09-21");
    expect(clampToRange("2026-10-01", range)).toBe("2026-09-28");
    expect(clampToRange("2026-09-24", range)).toBe("2026-09-24");
  });
});

describe("getPlannerRows", () => {
  const films = [
    movie("2", "Zodiac", [at("2026-09-21", 21), at("2026-09-21", 14)]),
    movie("1", "Alien", [at("2026-09-21", 18), at("2026-09-22", 18)]),
    movie("3", "Heat", [at("2026-09-22", 20)]),
  ];

  it("keeps films showing that day, alphabetically, with that day's times in order", () => {
    const rows = getPlannerRows(films, "2026-09-21");
    expect(rows.map((row) => row.movie.title)).toEqual(["Alien", "Zodiac"]);
    expect(rows[0].performances).toHaveLength(1);
    expect(rows[1].performances.map((p) => p.time)).toEqual([
      at("2026-09-21", 14),
      at("2026-09-21", 21),
    ]);
  });

  it("counts a late showing towards the day it starts, not the next", () => {
    const late = [movie("4", "Night", [at("2026-09-21", 23.5)])];
    expect(getPlannerRows(late, "2026-09-21")).toHaveLength(1);
    expect(getPlannerRows(late, "2026-09-22")).toHaveLength(0);
  });
});

describe("findNearestShowingDay", () => {
  const range = { first: "2026-09-21", last: "2026-09-30" };
  const films = [movie("1", "A", [at("2026-09-21", 19), at("2026-09-25", 19)])];

  it("finds the next and previous days with anything on", () => {
    expect(findNearestShowingDay(films, "2026-09-23", "next", range)).toBe(
      "2026-09-25",
    );
    expect(findNearestShowingDay(films, "2026-09-23", "previous", range)).toBe(
      "2026-09-21",
    );
  });

  it("is null when nothing lies that way", () => {
    expect(
      findNearestShowingDay(films, "2026-09-26", "next", range),
    ).toBeNull();
  });
});

describe("getPlannerHours", () => {
  const films = [
    movie("1", "Zodiac", [at("2026-09-21", 14.5), at("2026-09-21", 19)]),
    movie("2", "Alien", [at("2026-09-21", 19), at("2026-09-21", 14.25)]),
    movie("3", "Heat", [at("2026-09-22", 19)]),
  ];

  it("groups by London hour, soonest first then by title, with one divider per empty run", () => {
    const sections = getPlannerHours(films, "2026-09-21");
    expect(sections.map((s) => s.kind)).toEqual(["hour", "gap", "hour"]);
    expect(sections[1]).toEqual({ kind: "gap", from: 15, to: 18 });
    const [afternoon, , evening] = sections;
    if (afternoon.kind !== "hour" || evening.kind !== "hour") throw new Error();
    expect(afternoon.hour).toBe(14);
    expect(afternoon.items.map((i) => i.movie.title)).toEqual([
      "Alien",
      "Zodiac",
    ]);
    expect(evening.items.map((i) => i.movie.title)).toEqual([
      "Alien",
      "Zodiac",
    ]);
  });

  it("is empty for a day with nothing on", () => {
    expect(getPlannerHours(films, "2026-09-23")).toEqual([]);
  });

  it("formats hours as clock times", () => {
    expect(formatHour(9)).toBe("09:00");
    expect(formatHour(19)).toBe("19:00");
  });
});

describe("groupBySameStart", () => {
  it("groups one film at one start time, keeping other times and films apart", () => {
    const item = (id: string, time: number, n: number) => ({
      movie: { id },
      performance: { time },
      n,
    });
    const groups = groupBySameStart([
      item("a", 1800, 1),
      item("b", 1800, 2),
      item("a", 1800, 3),
      item("a", 1845, 4),
      item("a", 1800, 5),
    ]);
    expect(groups.map((g) => g.first.n)).toEqual([1, 2, 4]);
    expect(groups[0].rest.map((i) => i.n)).toEqual([3, 5]);
    expect(groups[2].rest).toEqual([]);
  });
});

describe("getPlannerWeek", () => {
  const range = { first: "2026-09-21", last: "2026-10-31" };

  it("puts the first day of the range at the start", () => {
    const week = getPlannerWeek("2026-09-21", range);
    expect(week).toHaveLength(7);
    expect(week[0]).toBe("2026-09-21");
    expect(week[6]).toBe("2026-09-27");
  });

  it("centres a day in the middle of the range", () => {
    const week = getPlannerWeek("2026-10-10", range);
    expect(week[0]).toBe("2026-10-07");
    expect(week[3]).toBe("2026-10-10");
    expect(week[6]).toBe("2026-10-13");
  });

  it("slides to stay inside the range near either end", () => {
    expect(getPlannerWeek("2026-09-22", range)[0]).toBe("2026-09-21");
    expect(getPlannerWeek("2026-10-30", range)[6]).toBe("2026-10-31");
    expect(getPlannerWeek("2026-10-31", range)[0]).toBe("2026-10-25");
  });

  it("shows a range shorter than a week whole", () => {
    const short = { first: "2026-09-21", last: "2026-09-23" };
    expect(getPlannerWeek("2026-09-22", short)).toEqual([
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
    ]);
  });

  it("covers a fortnight when asked, centred the same way", () => {
    const fortnight = getPlannerWeek("2026-10-10", range, 14);
    expect(fortnight).toHaveLength(14);
    expect(fortnight[0]).toBe("2026-10-04");
    expect(fortnight[13]).toBe("2026-10-17");
    expect(getPlannerWeek("2026-09-21", range, 14)[13]).toBe("2026-10-04");
  });

  it("counts whole days across a clock change", () => {
    const autumn = { first: "2026-10-22", last: "2026-11-30" };
    expect(getPlannerWeek("2026-10-29", autumn)[0]).toBe("2026-10-26");
  });
});

describe("getShowingDays", () => {
  it("returns only the requested days the film is on", () => {
    const film = movie("1", "A", [
      at("2026-09-22", 20),
      at("2026-09-22", 22),
      at("2026-09-25", 18),
      at("2026-10-10", 18),
    ]);
    const days = getShowingDays(film, [
      "2026-09-21",
      "2026-09-22",
      "2026-09-25",
    ]);
    expect([...days].sort()).toEqual(["2026-09-22", "2026-09-25"]);
  });

  it("files a late showing under its London date", () => {
    const film = movie("1", "A", [at("2026-09-22", 23.5)]);
    expect(getShowingDays(film, ["2026-09-22"]).has("2026-09-22")).toBe(true);
  });
});

describe("getLastShowingDay", () => {
  it("is the London date of the latest performance", () => {
    const film = movie("1", "A", [at("2026-09-25", 18), at("2026-09-22", 20)]);
    expect(getLastShowingDay(film)).toBe("2026-09-25");
  });

  it("is null for a film with no performances", () => {
    expect(getLastShowingDay(movie("1", "A", []))).toBeNull();
  });
});
