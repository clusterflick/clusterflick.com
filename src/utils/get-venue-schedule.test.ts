import { describe, it, expect } from "vitest";
import { Category, type Movie, type MoviePerformance } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import { getVenueSchedule } from "./get-venue-schedule";

const DAY = 86_400_000;
// A fixed London midnight (2023-11-14 00:00 Europe/London == 2023-11-14 00:00 UTC in winter).
const MIDNIGHT = Date.UTC(2023, 10, 14, 0, 0, 0);

interface ShowingSpec {
  venueId: string;
  times: number[];
}

function makeMovie(id: string, specs: ShowingSpec[]): Movie {
  const showings: Movie["showings"] = {};
  const performances: MoviePerformance[] = [];

  specs.forEach((spec, index) => {
    const showingId = `${id}-s${index}`;
    showings[showingId] = {
      id: showingId,
      category: Category.Movie,
      url: `https://example.com/${showingId}`,
      venueId: spec.venueId,
    };
    for (const time of spec.times) {
      performances.push({
        bookingUrl: `https://example.com/book/${showingId}`,
        showingId,
        time,
      });
    }
  });

  return {
    id,
    title: id,
    normalizedTitle: id,
    showings,
    performances,
  } as Movie;
}

function toRecord(movies: Movie[]): MoviesRecord {
  return Object.fromEntries(movies.map((m) => [m.id, m]));
}

describe("getVenueSchedule", () => {
  it("splits performances into today and tomorrow at the venue", () => {
    const movies = toRecord([
      makeMovie("a", [
        { venueId: "v1", times: [MIDNIGHT + 19 * 60 * 60 * 1000] },
      ]),
      makeMovie("b", [
        { venueId: "v1", times: [MIDNIGHT + DAY + 20 * 60 * 60 * 1000] },
      ]),
    ]);

    const [today, tomorrow] = getVenueSchedule(movies, "v1", MIDNIGHT);

    expect(today.label).toBe("Today");
    expect(today.entries.map((e) => e.movie.id)).toEqual(["a"]);
    expect(tomorrow.label).toBe("Tomorrow");
    expect(tomorrow.entries.map((e) => e.movie.id)).toEqual(["b"]);
  });

  it("excludes other venues and performances outside the 48h window", () => {
    const movies = toRecord([
      makeMovie("here", [{ venueId: "v1", times: [MIDNIGHT + 3600000] }]),
      makeMovie("elsewhere", [{ venueId: "v2", times: [MIDNIGHT + 3600000] }]),
      makeMovie("yesterday", [{ venueId: "v1", times: [MIDNIGHT - 3600000] }]),
      makeMovie("day-after", [
        { venueId: "v1", times: [MIDNIGHT + 2 * DAY + 3600000] },
      ]),
    ]);

    const [today, tomorrow] = getVenueSchedule(movies, "v1", MIDNIGHT);

    expect(today.entries.map((e) => e.movie.id)).toEqual(["here"]);
    expect(tomorrow.entries).toHaveLength(0);
  });

  it("sorts each day's performances by start time", () => {
    const movies = toRecord([
      makeMovie("late", [{ venueId: "v1", times: [MIDNIGHT + 21 * 3600000] }]),
      makeMovie("early", [{ venueId: "v1", times: [MIDNIGHT + 11 * 3600000] }]),
      makeMovie("mid", [{ venueId: "v1", times: [MIDNIGHT + 15 * 3600000] }]),
    ]);

    const [today] = getVenueSchedule(movies, "v1", MIDNIGHT);

    expect(today.entries.map((e) => e.movie.id)).toEqual([
      "early",
      "mid",
      "late",
    ]);
  });

  it("only counts a movie's performances tied to a showing at the venue", () => {
    // Movie screens at both v1 and v2; only the v1 performance should surface.
    const movie = makeMovie("split", [
      { venueId: "v1", times: [MIDNIGHT + 12 * 3600000] },
      { venueId: "v2", times: [MIDNIGHT + 13 * 3600000] },
    ]);

    const [today] = getVenueSchedule(toRecord([movie]), "v1", MIDNIGHT);

    expect(today.entries).toHaveLength(1);
    expect(today.entries[0].performance.showingId).toBe("split-s0");
  });
});
