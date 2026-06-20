import { describe, it, expect } from "vitest";
import {
  Category,
  type Movie,
  type MoviePerformance,
  type IncludedMovie,
} from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import {
  getPopularMovies,
  getNewAdditions,
  getLastChanceMovies,
  getMarathonMovies,
  getCriticsPicks,
  getRating,
  type DiscoveryWindow,
} from "./get-discovery-movies";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000; // 2023-11-14
const CURRENT_YEAR = new Date(NOW).getFullYear();
const WINDOW: DiscoveryWindow = { rangeStart: NOW, rangeEnd: NOW + 8 * DAY };

interface ShowingSpec {
  venueId: string;
  seen?: number;
  /** Performance times for this showing (defaults to one inside the window). */
  times?: number[];
  soldOut?: boolean;
}

interface MovieOpts {
  category?: Category;
  year?: string;
  releaseDate?: string;
  isUnmatched?: boolean;
  includedMovies?: IncludedMovie[];
  lb?: { rating: number; reviews: number };
  rt?: { score: number; reviews: number };
  imdb?: { rating: number; reviews: number };
}

function makeMovie(
  id: string,
  showingSpecs: ShowingSpec[],
  opts: MovieOpts = {},
): Movie {
  const { category = Category.Movie } = opts;
  const showings: Movie["showings"] = {};
  const performances: MoviePerformance[] = [];

  showingSpecs.forEach((spec, index) => {
    const showingId = `${id}-s${index}`;
    showings[showingId] = {
      id: showingId,
      category,
      url: `https://example.com/${showingId}`,
      venueId: spec.venueId,
      ...(spec.seen !== undefined ? { seen: spec.seen } : {}),
    };
    const times = spec.times ?? [NOW + DAY];
    for (const time of times) {
      performances.push({
        bookingUrl: `https://example.com/book/${showingId}`,
        showingId,
        time,
        ...(spec.soldOut ? { status: { soldOut: true } } : {}),
      });
    }
  });

  return {
    id,
    title: id,
    normalizedTitle: id,
    showings,
    performances,
    year: opts.year,
    releaseDate: opts.releaseDate,
    isUnmatched: opts.isUnmatched,
    includedMovies: opts.includedMovies,
    letterboxd: opts.lb
      ? {
          id: "lb",
          url: "",
          likes: 0,
          reviews: opts.lb.reviews,
          rating: opts.lb.rating,
        }
      : undefined,
    rottenTomatoes: opts.rt
      ? {
          id: "rt",
          url: "",
          audience: { all: undefined, verified: undefined },
          critics: {
            all: { reviews: opts.rt.reviews, score: opts.rt.score },
            top: undefined,
          },
        }
      : undefined,
    imdb: opts.imdb
      ? {
          id: "im",
          url: "",
          rating: opts.imdb.rating,
          reviews: opts.imdb.reviews,
          unweightedRating: null,
        }
      : undefined,
  };
}

function asRecord(movies: Movie[]): MoviesRecord {
  return Object.fromEntries(movies.map((m) => [m.id, m]));
}

describe("getPopularMovies", () => {
  it("ranks by weighted venue breadth over performance frequency", () => {
    const wide = makeMovie("wide", [
      { venueId: "v1" },
      { venueId: "v2" },
      { venueId: "v3" },
    ]); // 3 venues, 3 perfs -> 3*3 + 3 = 12
    const deep = makeMovie("deep", [
      { venueId: "v1", times: [NOW + DAY, NOW + 2 * DAY] },
      { venueId: "v2", times: [NOW + DAY, NOW + 2 * DAY] },
    ]); // 2 venues, 4 perfs -> 2*3 + 4 = 10

    const result = getPopularMovies(asRecord([deep, wide]), WINDOW);

    expect(result.map((r) => r.movie.id)).toEqual(["wide", "deep"]);
    expect(result[0].subtitle).toBe("3 venues · 3 showings");
  });

  it("excludes single-venue runs and respects excludeIds", () => {
    const repRun = makeMovie("rep", [
      { venueId: "v1", times: [NOW + DAY, NOW + 2 * DAY] },
    ]); // 1 venue only
    const wide = makeMovie("wide", [{ venueId: "v1" }, { venueId: "v2" }]);

    expect(getPopularMovies(asRecord([repRun]), WINDOW)).toHaveLength(0);
    expect(
      getPopularMovies(asRecord([wide]), WINDOW, 12, new Set(["wide"])),
    ).toHaveLength(0);
  });
});

describe("getNewAdditions", () => {
  function recentlyAdded(id: string, opts: MovieOpts): Movie {
    return makeMovie(
      "na-" + id,
      [{ venueId: "v1", seen: NOW - 1 * DAY }],
      opts,
    );
  }

  // NOW is 2023-11-14, so a release date in mid-October is within ~2 months.
  const RECENT_RELEASE_DATE = "2023-10-15";

  it("buckets matched recent additions by film age", () => {
    const movies = asRecord([
      recentlyAdded("new", { releaseDate: RECENT_RELEASE_DATE }),
      // Released earlier this year (1 Jan) — older than 2 months, under 15 years.
      recentlyAdded("returning", { year: String(CURRENT_YEAR) }),
      recentlyAdded("classic", { year: String(CURRENT_YEAR - 20) }),
    ]);

    const result = getNewAdditions(movies, WINDOW, NOW);

    expect(result.newReleases.map((r) => r.movie.id)).toEqual(["na-new"]);
    expect(result.returning.map((r) => r.movie.id)).toEqual(["na-returning"]);
    expect(result.classics.map((r) => r.movie.id)).toEqual(["na-classic"]);
    expect(result.newReleases[0].subtitle).toBe("2023");
  });

  it("treats a film released a few months ago as returning, not new", () => {
    // Released ~4 months before NOW — should not count as a new release.
    const movie = recentlyAdded("fourmonths", { releaseDate: "2023-07-10" });
    const result = getNewAdditions(asRecord([movie]), WINDOW, NOW);

    expect(result.newReleases).toHaveLength(0);
    expect(result.returning.map((r) => r.movie.id)).toEqual(["na-fourmonths"]);
  });

  it("treats films older than 15 years as classics, not returning", () => {
    const movie = recentlyAdded("old", { year: String(CURRENT_YEAR - 16) });
    const result = getNewAdditions(asRecord([movie]), WINDOW, NOW);

    expect(result.classics.map((r) => r.movie.id)).toEqual(["na-old"]);
    expect(result.returning).toHaveLength(0);
  });

  it("includes recent additions even when they show beyond this week", () => {
    // Added a day ago, but its only performance is a month out — should still
    // surface, since the row is about what's newly tracked, not what's showing soon.
    const future = makeMovie(
      "na-future",
      [{ venueId: "v1", seen: NOW - 1 * DAY, times: [NOW + 30 * DAY] }],
      { releaseDate: RECENT_RELEASE_DATE },
    );
    const result = getNewAdditions(asRecord([future]), WINDOW, NOW);
    expect(result.newReleases.map((r) => r.movie.id)).toEqual(["na-future"]);
  });

  it("excludes recent additions with no upcoming performances", () => {
    // Added a day ago, but every performance is in the past — would be a dead link.
    const past = makeMovie(
      "na-past",
      [{ venueId: "v1", seen: NOW - 1 * DAY, times: [NOW - 2 * DAY] }],
      { releaseDate: RECENT_RELEASE_DATE },
    );
    const result = getNewAdditions(asRecord([past]), WINDOW, NOW);
    expect(
      result.newReleases.length +
        result.returning.length +
        result.classics.length,
    ).toBe(0);
  });

  it("excludes films added more than a week ago", () => {
    const stale = makeMovie("stale", [{ venueId: "v1", seen: NOW - 9 * DAY }], {
      year: String(CURRENT_YEAR),
    });
    const result = getNewAdditions(asRecord([stale]), WINDOW, NOW);
    expect(result.newReleases).toHaveLength(0);
  });

  it("excludes unmatched films and films without a year", () => {
    const unmatched = makeMovie(
      "unmatched",
      [{ venueId: "v1", seen: NOW - 1 * DAY }],
      { year: String(CURRENT_YEAR), isUnmatched: true },
    );
    const noYear = makeMovie("no-year", [
      { venueId: "v1", seen: NOW - 1 * DAY },
    ]);

    const result = getNewAdditions(asRecord([unmatched, noYear]), WINDOW, NOW);
    expect(
      result.newReleases.length +
        result.returning.length +
        result.classics.length,
    ).toBe(0);
  });

  it("honours excludeIds", () => {
    const movie = recentlyAdded("dup", { releaseDate: RECENT_RELEASE_DATE });
    const result = getNewAdditions(
      asRecord([movie]),
      WINDOW,
      NOW,
      new Set(["na-dup"]),
    );
    expect(
      result.newReleases.length +
        result.returning.length +
        result.classics.length,
    ).toBe(0);
  });
});

describe("getLastChanceMovies", () => {
  it("includes matched films whose final non-sold-out showing is within 7 days", () => {
    const ending = makeMovie("ending", [
      { venueId: "v1", times: [NOW + DAY, NOW + 6 * DAY] },
    ]);
    const result = getLastChanceMovies(asRecord([ending]), NOW);
    expect(result.map((r) => r.movie.id)).toEqual(["ending"]);
    expect(result[0].subtitle).toMatch(/^Last showing /);
  });

  it("excludes films still running beyond 7 days", () => {
    const running = makeMovie("running", [
      { venueId: "v1", times: [NOW + DAY, NOW + 9 * DAY] },
    ]);
    expect(getLastChanceMovies(asRecord([running]), NOW)).toHaveLength(0);
  });

  it("ignores sold-out performances when finding the final showing", () => {
    // Open showing in 2 days, plus a sold-out one in 9 days that shouldn't count.
    const movie = makeMovie("mixed", [
      { venueId: "v1", times: [NOW + 2 * DAY] },
      { venueId: "v2", times: [NOW + 9 * DAY], soldOut: true },
    ]);
    const result = getLastChanceMovies(asRecord([movie]), NOW);
    expect(result.map((r) => r.movie.id)).toEqual(["mixed"]);
  });

  it("excludes unmatched films and sorts soonest-ending first", () => {
    const soon = makeMovie("soon", [{ venueId: "v1", times: [NOW + DAY] }]);
    const later = makeMovie("later", [
      { venueId: "v1", times: [NOW + 3 * DAY] },
    ]);
    const unmatched = makeMovie(
      "unmatched",
      [{ venueId: "v1", times: [NOW + DAY] }],
      { isUnmatched: true },
    );

    const result = getLastChanceMovies(asRecord([later, soon, unmatched]), NOW);
    expect(result.map((r) => r.movie.id)).toEqual(["soon", "later"]);
  });
});

describe("getMarathonMovies", () => {
  it("includes multi-film events and labels the film count", () => {
    const marathon = makeMovie("marathon", [{ venueId: "v1" }], {
      includedMovies: [
        { id: "a", title: "Part 1" },
        { id: "b", title: "Part 2" },
        { id: "c", title: "Part 3" },
      ],
    });
    const single = makeMovie("single", [{ venueId: "v1" }]);

    const result = getMarathonMovies(asRecord([marathon, single]), WINDOW);
    expect(result.map((r) => r.movie.id)).toEqual(["marathon"]);
    expect(result[0].subtitle).toBe("3 films");
  });

  it("requires an upcoming performance and honours excludeIds", () => {
    const past = makeMovie("past", [{ venueId: "v1", times: [NOW - DAY] }], {
      includedMovies: [
        { id: "a", title: "Part 1" },
        { id: "b", title: "Part 2" },
      ],
    });
    expect(getMarathonMovies(asRecord([past]), WINDOW)).toHaveLength(0);

    const upcoming = makeMovie("up", [{ venueId: "v1" }], {
      includedMovies: [
        { id: "a", title: "Part 1" },
        { id: "b", title: "Part 2" },
      ],
    });
    expect(
      getMarathonMovies(asRecord([upcoming]), WINDOW, 12, new Set(["up"])),
    ).toHaveLength(0);
  });
});

describe("getRating", () => {
  it("requires enough reviews before a rating counts", () => {
    // 90% from only 10 RT critics — high score, thin signal → ignored.
    const thin = makeMovie("thin", [{ venueId: "v1" }], {
      rt: { score: 90, reviews: 10 },
    });
    expect(getRating(thin)).toBeNull();

    const solid = makeMovie("solid", [{ venueId: "v1" }], {
      rt: { score: 90, reviews: 80 },
    });
    expect(getRating(solid)?.norm).toBeCloseTo(0.9);
  });

  it("prefers Letterboxd, then Rotten Tomatoes, then IMDb", () => {
    const movie = makeMovie("m", [{ venueId: "v1" }], {
      lb: { rating: 4.2, reviews: 5000 },
      rt: { score: 95, reviews: 100 },
      imdb: { rating: 8.5, reviews: 50000 },
    });
    expect(getRating(movie)?.text).toBe("4.2/5 on Letterboxd");
  });
});

describe("getCriticsPicks", () => {
  it("ranks well-reviewed acclaimed films by rating", () => {
    const great = makeMovie("great", [{ venueId: "v1" }], {
      lb: { rating: 4.6, reviews: 100000 },
    });
    const good = makeMovie("good", [{ venueId: "v1" }], {
      lb: { rating: 4.1, reviews: 100000 },
    });

    const result = getCriticsPicks(asRecord([good, great]), WINDOW, 12, NOW);
    expect(result.map((r) => r.movie.id)).toEqual(["great", "good"]);
    expect(result[0].subtitle).toBe("4.6/5 on Letterboxd");
  });

  it("excludes high scores backed by too few reviews", () => {
    const thin = makeMovie("thin", [{ venueId: "v1" }], {
      rt: { score: 95, reviews: 10 },
    });
    expect(getCriticsPicks(asRecord([thin]), WINDOW, 12, NOW)).toHaveLength(0);
  });

  it("excludes films below the acclaim threshold", () => {
    const ok = makeMovie("ok", [{ venueId: "v1" }], {
      lb: { rating: 3.7, reviews: 100000 }, // norm 0.74 < 0.8
    });
    expect(getCriticsPicks(asRecord([ok]), WINDOW, 12, NOW)).toHaveLength(0);
  });

  it("excludes unmatched, evergreen, and not-showing-this-week films", () => {
    const unmatched = makeMovie("unmatched", [{ venueId: "v1" }], {
      lb: { rating: 4.5, reviews: 100000 },
      isUnmatched: true,
    });
    const evergreen = makeMovie(
      "evergreen",
      [
        {
          venueId: "v1",
          times: Array.from({ length: 40 }, (_, i) => NOW + i * DAY),
        },
      ],
      { lb: { rating: 4.5, reviews: 100000 } },
    );
    const notThisWeek = makeMovie(
      "later",
      [{ venueId: "v1", times: [NOW + 100 * DAY] }],
      {
        lb: { rating: 4.5, reviews: 100000 },
      },
    );

    const result = getCriticsPicks(
      asRecord([unmatched, evergreen, notThisWeek]),
      WINDOW,
      12,
      NOW,
    );
    expect(result).toHaveLength(0);
  });
});
