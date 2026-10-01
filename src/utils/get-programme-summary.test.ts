import { describe, it, expect } from "vitest";
import { Category, type Movie, type MoviePerformance } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import {
  getProgrammeSummary,
  getNextUpRow,
  getProgrammeRow,
  formatProgrammeScreening,
} from "./get-programme-summary";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000; // 2023-11-14

function makeMovie(
  id: string,
  times: number[],
  opts: { posterPath?: string; soldOut?: number[] } = {},
): Movie {
  const performances: MoviePerformance[] = times.map((time) => ({
    bookingUrl: `https://example.com/book/${id}`,
    showingId: `${id}-s0`,
    time,
    ...(opts.soldOut?.includes(time) ? { status: { soldOut: true } } : {}),
  }));
  return {
    id,
    title: id,
    normalizedTitle: id,
    showings: {
      [`${id}-s0`]: {
        id: `${id}-s0`,
        category: Category.Movie,
        url: `https://example.com/${id}`,
        venueId: "venue",
      },
    },
    performances,
    posterPath: opts.posterPath,
  } as Movie;
}

function record(...movies: Movie[]): MoviesRecord {
  return Object.fromEntries(movies.map((movie) => [movie.id, movie]));
}

describe("getProgrammeSummary", () => {
  it("counts only films with an upcoming performance", () => {
    const summary = getProgrammeSummary(
      record(makeMovie("past", [NOW - DAY]), makeMovie("future", [NOW + DAY])),
      { now: NOW },
    );
    expect(summary.movieCount).toBe(1);
  });

  it("orders posters soonest first, putting films with art ahead", () => {
    const summary = getProgrammeSummary(
      record(
        makeMovie("later", [NOW + 3 * DAY], { posterPath: "/later.jpg" }),
        makeMovie("no-art", [NOW + DAY]),
        makeMovie("soon", [NOW + 2 * DAY], { posterPath: "/soon.jpg" }),
      ),
      { now: NOW },
    );
    expect(summary.posters.map((p) => p.title)).toEqual([
      "soon",
      "later",
      "no-art",
    ]);
  });

  it("caps the posters", () => {
    const movies = Array.from({ length: 6 }, (_, i) =>
      makeMovie(`m${i}`, [NOW + (i + 1) * DAY], { posterPath: `/${i}.jpg` }),
    );
    const summary = getProgrammeSummary(record(...movies), {
      now: NOW,
      posterLimit: 4,
    });
    expect(summary.posters).toHaveLength(4);
  });

  it("skips sold-out screenings when picking the next one", () => {
    const summary = getProgrammeSummary(
      record(
        makeMovie("sold-out", [NOW + DAY], { soldOut: [NOW + DAY] }),
        makeMovie("bookable", [NOW + 2 * DAY]),
      ),
      { now: NOW },
    );
    expect(summary.next?.movie.id).toBe("bookable");
    expect(summary.next?.time).toBe(NOW + 2 * DAY);
  });

  it("has no next screening when everything is sold out", () => {
    const summary = getProgrammeSummary(
      record(makeMovie("a", [NOW + DAY], { soldOut: [NOW + DAY] })),
      { now: NOW },
    );
    expect(summary.next).toBeNull();
    expect(summary.movieCount).toBe(1);
  });

  it("does not reorder the dataset's own performances", () => {
    const movie = makeMovie("a", [NOW + 3 * DAY, NOW + DAY]);
    getProgrammeSummary(record(movie), { now: NOW });
    expect(movie.performances.map((p) => p.time)).toEqual([
      NOW + 3 * DAY,
      NOW + DAY,
    ]);
  });
});

describe("getNextUpRow", () => {
  it("takes one screening per programme, soonest first", () => {
    const row = getNextUpRow(
      [
        {
          name: "Weekly Club",
          movies: record(
            makeMovie("w1", [NOW + DAY]),
            makeMovie("w2", [NOW + 2 * DAY]),
          ),
        },
        {
          name: "Monthly Club",
          movies: record(makeMovie("m1", [NOW + 5 * DAY])),
        },
        { name: "Dormant Club", movies: {} },
      ],
      { now: NOW },
    );
    expect(row.map((item) => item.movie.id)).toEqual(["w1", "m1"]);
    expect(row[0].subtitle).toBe(
      formatProgrammeScreening("Weekly Club", NOW + DAY),
    );
  });

  it("shows a film two programmes share only once", () => {
    const shared = makeMovie("shared", [NOW + DAY]);
    const row = getNextUpRow(
      [
        { name: "A", movies: record(shared) },
        { name: "B", movies: record(shared) },
      ],
      { now: NOW },
    );
    expect(row).toHaveLength(1);
  });

  it("caps the row", () => {
    const programmes = Array.from({ length: 5 }, (_, i) => ({
      name: `Club ${i}`,
      movies: record(makeMovie(`m${i}`, [NOW + (i + 1) * DAY])),
    }));
    expect(getNextUpRow(programmes, { now: NOW, limit: 3 })).toHaveLength(3);
  });
});

describe("getProgrammeRow", () => {
  it("lists films soonest first, dated by their next bookable screening", () => {
    const row = getProgrammeRow(
      record(
        makeMovie("later", [NOW + 3 * DAY]),
        makeMovie("sold-out-first", [NOW + DAY, NOW + 4 * DAY], {
          soldOut: [NOW + DAY],
        }),
        makeMovie("past", [NOW - DAY]),
      ),
      { now: NOW },
    );
    expect(row.map((item) => item.movie.id)).toEqual([
      "later",
      "sold-out-first",
    ]);
  });

  it("dates a fully sold-out film by its first screening", () => {
    const row = getProgrammeRow(
      record(makeMovie("a", [NOW + 2 * DAY], { soldOut: [NOW + 2 * DAY] })),
      { now: NOW },
    );
    expect(row).toHaveLength(1);
  });
});

describe("formatProgrammeScreening", () => {
  it("binds the date together with non-breaking spaces", () => {
    expect(formatProgrammeScreening("Bar Trash", NOW)).toBe(
      "Bar Trash · Tue 14 Nov",
    );
  });
});
