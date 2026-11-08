import { describe, it, expect } from "vitest";
import { Category, type CinemaData, type Movie, type Venue } from "@/types";
import { getCinemaGroupsIndex } from "./get-cinema-groups-index";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

function makeMovie(
  id: string,
  showings: { venue: string; days: number[] }[],
  { category = Category.Movie, posterPath = `/${id}.jpg` } = {},
): Movie {
  return {
    id,
    title: id,
    normalizedTitle: id,
    posterPath,
    showings: Object.fromEntries(
      showings.map(({ venue }) => [
        `${id}-${venue}`,
        { id: `${id}-${venue}`, category, url: "", venueId: venue },
      ]),
    ),
    performances: showings.flatMap(({ venue, days }) =>
      days.map((day) => ({
        bookingUrl: "",
        showingId: `${id}-${venue}`,
        time: NOW + day * DAY,
      })),
    ),
  } as unknown as Movie;
}

const venue = (id: string) => ({ id, name: id }) as unknown as Venue;

// Two chains from the registry and one independent venue.
const curzon = [venue("curzon-a"), venue("curzon-b")];
const odeon = [venue("odeon-a")];
const venuesByGroup = new Map([
  ["curzon", curzon],
  ["odeon", odeon],
  // In the registry but with nothing on this week.
  ["rooftop-cinema-club", [venue("rooftop-a")]],
]);

const data = {
  venues: Object.fromEntries(
    [...curzon, ...odeon, venue("rooftop-a"), venue("indie")].map((v) => [
      v.id,
      v,
    ]),
  ),
  movies: {
    // On at both chains and the independent.
    blockbuster: makeMovie("blockbuster", [
      { venue: "curzon-a", days: [1] },
      { venue: "odeon-a", days: [1, 1.5, 2, 3] },
      { venue: "indie", days: [2] },
    ]),
    // Only at Curzon, across both its venues.
    arthouse: makeMovie("arthouse", [
      { venue: "curzon-a", days: [1, 2] },
      { venue: "curzon-b", days: [3] },
    ]),
    // Only at Curzon this week; at the independent only after the week.
    revival: makeMovie("revival", [
      { venue: "curzon-b", days: [4] },
      { venue: "indie", days: [9] },
    ]),
    // Only at ODEON, but not one of the catalogue's default categories.
    quiz: makeMovie("quiz", [{ venue: "odeon-a", days: [1] }], {
      category: Category.Quiz,
    }),
    // At the rooftop, but only after the week.
    later: makeMovie("later", [{ venue: "rooftop-a", days: [10] }]),
  },
} as unknown as CinemaData;

const index = getCinemaGroupsIndex(data, venuesByGroup, {
  now: NOW,
  getImagePath: (slug) => `/images/venues/${slug}.png`,
});

describe("getCinemaGroupsIndex", () => {
  it("counts each chain's week and what only it is showing", () => {
    expect(
      index.activeGroups.map(
        ({ slug, venueCount, films, screenings, onlyHere }) => ({
          slug,
          venueCount,
          films,
          screenings,
          onlyHere,
        }),
      ),
    ).toEqual([
      // Most films first.
      {
        slug: "curzon",
        venueCount: 2,
        films: 3,
        screenings: 5,
        onlyHere: 2,
      },
      { slug: "odeon", venueCount: 1, films: 1, screenings: 4, onlyHere: 0 },
    ]);
  });

  it("leads with what only the chain is showing, without repeating a poster", () => {
    expect(index.activeGroups[0].posters.map((p) => p.title)).toEqual([
      "arthouse",
      "revival",
      "blockbuster",
    ]);
    // The blockbuster is Curzon's already, but it is all ODEON has, so it is
    // still shown rather than leaving the card bare.
    expect(index.activeGroups[1].posters.map((p) => p.title)).toEqual([
      "blockbuster",
    ]);
  });

  it("names chains with nothing on separately", () => {
    expect(index.inactiveGroups.map((group) => group.slug)).toEqual([
      "rooftop-cinema-club",
    ]);
  });

  it("totals the whole city's week, chains or not", () => {
    expect(index.totalVenues).toBe(5);
    // Every default-category showing in the week, the independent's included.
    expect(index.totalScreenings).toBe(10);
  });
});
