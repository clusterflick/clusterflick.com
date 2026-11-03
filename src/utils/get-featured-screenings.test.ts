import { describe, it, expect } from "vitest";
import { Category, type CinemaData, type Movie } from "@/types";
import type { EditorialSummary } from "./get-editorial-summary";
import {
  formatFeaturedWhen,
  getFeaturedScreenings,
  getUpcomingFeatured,
} from "./get-featured-screenings";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// Tuesday 3 November 2026, 12:00 in London (GMT).
const NOW = Date.UTC(2026, 10, 3, 12);

function makeMovie(id: string, title: string, offsets: number[]): Movie {
  return {
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    year: "1985",
    directors: ["p1"],
    posterPath: `/${id}.jpg`,
    youtubeTrailer: "abc",
    overview: `About ${title}`,
    letterboxd: { rating: 4.51, reviews: 50_000 },
    showings: {
      [`${id}-s`]: {
        id: `${id}-s`,
        category: Category.Movie,
        url: `https://example.com/${id}`,
        venueId: "venue-1",
      },
    },
    performances: offsets.map((offset, index) => ({
      bookingUrl: `https://example.com/book/${id}-${index}`,
      showingId: `${id}-s`,
      time: NOW + offset,
    })),
  } as unknown as Movie;
}

const data = {
  movies: {
    ran: makeMovie("ran", "Ran", [5 * DAY]),
    her: makeMovie("her", "Her", [DAY, 2 * DAY]),
    wide: makeMovie("wide", "Wide Release", [HOUR, 2 * HOUR, 8 * DAY]),
  },
  venues: { "venue-1": { name: "The Chiswick Cinema" } },
  people: { p1: { name: "Akira Kurosawa" } },
} as unknown as CinemaData;

function summary(
  text: string,
  links: EditorialSummary["links"],
): EditorialSummary {
  return { generatedAt: "", source: "ai", text, links };
}

const ranLink = {
  phrase: "Ran",
  movieId: "ran",
  highlight: {
    kind: "one-off" as const,
    label: "One night only",
    performance: { time: NOW + 5 * DAY, venueId: "venue-1" },
  },
};
const herLink = {
  phrase: "Her",
  movieId: "her",
  highlight: {
    kind: "final-showing" as const,
    label: "Final showing",
    performance: { time: NOW + 2 * DAY, venueId: "venue-1" },
  },
};
const wideLink = {
  phrase: "Wide Release",
  movieId: "wide",
  highlight: { kind: "popular" as const, label: "Showing at 96 venues" },
};

describe("getFeaturedScreenings", () => {
  it("features the films the text names, in the order it names them", () => {
    const featured = getFeaturedScreenings(
      summary("Catch Her before Ran.", [ranLink, herLink, wideLink]),
      data,
      NOW,
    );
    expect(featured.map((f) => f.movieId)).toEqual(["her", "ran"]);
  });

  it("does not match a title inside a longer word", () => {
    const featured = getFeaturedScreenings(
      summary("There is a Wide Release on.", [herLink, wideLink]),
      data,
      NOW,
    );
    expect(featured.map((f) => f.movieId)).toEqual(["wide"]);
  });

  it("carries the reason, the showing and what the card shows", () => {
    const [ran] = getFeaturedScreenings(summary("Ran.", [ranLink]), data, NOW);
    expect(ran).toEqual({
      movieId: "ran",
      title: "Ran",
      href: "/movies/ran/ran#show-all",
      posterPath: "/ran.jpg",
      label: "One night only",
      tone: "pink",
      credit: "Akira Kurosawa · 1985",
      rating: "4.5/5 on Letterboxd",
      overview: "About Ran",
      trailerUrl: "https://www.youtube.com/watch?v=abc",
      performance: {
        time: NOW + 5 * DAY,
        venueName: "The Chiswick Cinema",
        venueHref: "/venues/the-chiswick-cinema",
      },
      weekShowings: 1,
    });
  });

  it("counts a popular film's showings this week and names no one showing", () => {
    const [wide] = getFeaturedScreenings(
      summary("Wide Release.", [wideLink]),
      data,
      NOW,
    );
    expect(wide.performance).toBeNull();
    expect(wide.weekShowings).toBe(2);
    expect(wide.tone).toBe("gray");
  });

  it("skips links without a highlight, from summaries written before them", () => {
    const featured = getFeaturedScreenings(
      summary("Ran and Her.", [{ phrase: "Ran", movieId: "ran" }, herLink]),
      data,
      NOW,
    );
    expect(featured.map((f) => f.movieId)).toEqual(["her"]);
  });

  it("skips a highlighted showing that has already started", () => {
    const featured = getFeaturedScreenings(
      summary("Ran and Her.", [ranLink, herLink]),
      data,
      NOW + 3 * DAY,
    );
    expect(featured.map((f) => f.movieId)).toEqual(["ran"]);
  });

  it("skips films the dataset no longer holds, and venue links", () => {
    const featured = getFeaturedScreenings(
      summary("Gone, at The Chiswick Cinema, then Her.", [
        { ...ranLink, phrase: "Gone", movieId: "gone" },
        { phrase: "The Chiswick Cinema", venueId: "venue-1" },
        herLink,
      ]),
      data,
      NOW,
    );
    expect(featured.map((f) => f.movieId)).toEqual(["her"]);
  });

  it("stops at the limit", () => {
    const featured = getFeaturedScreenings(
      summary("Ran, Her, Wide Release.", [ranLink, herLink, wideLink]),
      data,
      NOW,
      2,
    );
    expect(featured).toHaveLength(2);
  });

  it("returns nothing without a summary", () => {
    expect(getFeaturedScreenings(null, data, NOW)).toEqual([]);
  });
});

describe("getUpcomingFeatured", () => {
  it("drops showings that have started, and keeps ones about reach", () => {
    const featured = getFeaturedScreenings(
      summary("Ran, Her, Wide Release.", [ranLink, herLink, wideLink]),
      data,
      NOW,
    );
    expect(
      getUpcomingFeatured(featured, NOW + 3 * DAY).map((f) => f.movieId),
    ).toEqual(["ran", "wide"]);
  });
});

describe("formatFeaturedWhen", () => {
  const at = (days: number, hour: number) =>
    Date.UTC(2026, 10, 3 + days, hour, 30);

  it("names today and tomorrow", () => {
    expect(formatFeaturedWhen(at(0, 19), NOW)).toBe("Today, 19:30");
    expect(formatFeaturedWhen(at(1, 19), NOW)).toBe("Tomorrow, 19:30");
  });

  it("uses the weekday within the week", () => {
    expect(formatFeaturedWhen(at(5, 19), NOW)).toBe("Sunday, 19:30");
  });

  it("uses the date from a week out, where a weekday would mean this one", () => {
    expect(formatFeaturedWhen(at(7, 18), NOW)).toBe("Tue 10 Nov, 18:30");
  });
});
