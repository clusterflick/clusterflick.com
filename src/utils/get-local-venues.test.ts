import { describe, it, expect } from "vitest";
import { Category, type Movie, type MoviePerformance } from "@/types";
import type { NearMeFilmClub, NearMeVenue } from "@/utils/get-near-me-data";
import { getLocalVenues, LOCAL_NEXT_SCREENINGS } from "./get-local-venues";

const HOUR = 3_600_000;
const NOW = 1_700_000_000_000;
const HERE = { lat: 51.5, lon: -0.1 };
// Roughly a mile of latitude.
const MILE = 1 / 69;

function venue(id: string, milesNorth: number): NearMeVenue {
  return {
    id,
    name: id,
    href: `/venues/${id}`,
    type: "Cinema",
    imagePath: null,
    lat: HERE.lat + milesNorth * MILE,
    lon: HERE.lon,
    boroughSlug: null,
    filmCount: 1,
    performanceCount: 1,
  };
}

/** A film at `venueId` with a performance at each of `hoursFromNow`. */
function film(
  id: string,
  venueId: string,
  hoursFromNow: number[],
  {
    category = Category.Movie,
    soldOut = false,
  }: { category?: Category; soldOut?: boolean } = {},
): Movie {
  const showingId = `${id}-s0`;
  return {
    id,
    title: id,
    normalizedTitle: id,
    showings: {
      [showingId]: {
        id: showingId,
        category,
        url: `https://example.com/${showingId}`,
        venueId,
      },
    },
    performances: hoursFromNow.map(
      (hours): MoviePerformance => ({
        bookingUrl: "https://example.com/book",
        showingId,
        time: NOW + hours * HOUR,
        ...(soldOut ? { status: { soldOut: true } } : {}),
      }),
    ),
  } as Movie;
}

/** Six screenings over the week — one more than the floor. */
const BUSY = [1, 2, 24, 25, 48, 49];

const record = (movies: Movie[]) =>
  Object.fromEntries(movies.map((m) => [m.id, m]));

const ids = (locals: ReturnType<typeof getLocalVenues>) =>
  locals.map(({ venue }) => venue.id);

describe("getLocalVenues", () => {
  it("takes the closest two venues with more than five screenings this week", () => {
    const venues = [venue("a", 0.2), venue("b", 1), venue("c", 1.5)];
    const movies = record([
      film("fa", "a", BUSY),
      film("fb", "b", BUSY),
      film("fc", "c", BUSY),
    ]);

    expect(ids(getLocalVenues(HERE, venues, movies, [], NOW))).toEqual([
      "a",
      "b",
    ]);
  });

  it("adds a third local within half a mile", () => {
    const venues = [venue("a", 0.1), venue("b", 0.2), venue("c", 0.4)];
    const movies = record([
      film("fa", "a", BUSY),
      film("fb", "b", BUSY),
      film("fc", "c", BUSY),
    ]);

    expect(ids(getLocalVenues(HERE, venues, movies, [], NOW))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("passes over a closer venue with only five screenings", () => {
    const venues = [venue("quiet", 0.1), venue("busy", 1)];
    const movies = record([
      film("fq", "quiet", [1, 2, 3, 4, 5]),
      film("fb", "busy", BUSY),
    ]);

    expect(ids(getLocalVenues(HERE, venues, movies, [], NOW))).toEqual([
      "busy",
    ]);
  });

  it("does not count past, sold-out, far-off or non-film screenings", () => {
    const venues = [venue("a", 0.1)];
    const movies = record([
      film("past", "a", [-2, -1]),
      film("sold", "a", [3], { soldOut: true }),
      film("later", "a", [8 * 24]),
      film("quiz", "a", [4, 5], { category: Category.Quiz }),
      film("real", "a", [6, 7, 8, 9]),
    ]);

    expect(getLocalVenues(HERE, venues, movies, [], NOW)).toEqual([]);
  });

  it("ignores venues beyond two miles", () => {
    const movies = record([film("f", "far", BUSY)]);
    expect(getLocalVenues(HERE, [venue("far", 2.5)], movies, [], NOW)).toEqual(
      [],
    );
  });

  it("lists the next screenings soonest first, with the venue's film clubs", () => {
    const clubs: NearMeFilmClub[] = [
      {
        id: "club",
        name: "Club",
        href: "/film-clubs/club",
        imagePath: null,
        seoDescription: null,
        movieCount: 2,
        performanceCount: 2,
        venueIds: ["a"],
      },
      {
        id: "elsewhere",
        name: "Elsewhere",
        href: "/film-clubs/elsewhere",
        imagePath: null,
        seoDescription: null,
        movieCount: 2,
        performanceCount: 2,
        venueIds: ["b"],
      },
    ];
    const movies = record([
      film("late", "a", [30, 31, 32]),
      film("early", "a", [1, 2, 3]),
    ]);

    const [local] = getLocalVenues(HERE, [venue("a", 0.1)], movies, clubs, NOW);
    expect(local.weekScreeningCount).toBe(6);
    expect(local.nextScreenings).toHaveLength(LOCAL_NEXT_SCREENINGS);
    expect(local.nextScreenings.map(({ movie }) => movie.id)).toEqual([
      "early",
      "early",
      "early",
      "late",
      "late",
    ]);
    expect(local.filmClubs.map((club) => club.id)).toEqual(["club"]);
  });
});
