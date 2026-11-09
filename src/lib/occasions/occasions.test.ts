import { describe, it, expect } from "vitest";
import { Category, type Movie, type MoviePerformanceOccasions } from "@/types";
import {
  getOccasionTags,
  isNoteCoveredByOccasions,
  matchOccasions,
  OccasionKind,
} from "./rules";
import { findOccasions, findBestOccasionPerMovie } from "./index";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000; // 2023-11-14

const labels = (occasions: MoviePerformanceOccasions) =>
  matchOccasions(occasions).map((m) => m.label);

/**
 * A film with one showing per venue and `count` performances at each. The
 * first carries `occasions`; `everyPerformance` is on all of them, as an
 * occasion the venue put in its showing title is.
 */
function makeMovie(
  id: string,
  {
    venues = ["venue-1"],
    count = 1,
    occasions,
    everyPerformance,
    soldOut = false,
    ...overrides
  }: {
    venues?: string[];
    count?: number;
    occasions?: MoviePerformanceOccasions;
    everyPerformance?: MoviePerformanceOccasions;
    /** Marks the occasion-bearing performance (the first) as sold out. */
    soldOut?: boolean;
  } & Partial<Movie> = {},
): Movie {
  const showings: Movie["showings"] = {};
  const performances: Movie["performances"] = [];

  venues.forEach((venueId, venueIndex) => {
    const showingId = `${id}-${venueIndex}`;
    showings[showingId] = {
      id: showingId,
      category: Category.Movie,
      url: `https://example.com/${showingId}`,
      venueId,
    };
    for (let i = 0; i < count; i++) {
      performances.push({
        bookingUrl: `https://example.com/book/${showingId}-${i}`,
        showingId,
        time: NOW + DAY + i * DAY,
        occasions: (i === 0 ? occasions : undefined) ?? everyPerformance,
        ...(soldOut && i === 0 ? { status: { soldOut: true } } : {}),
      });
    }
  });

  return {
    id,
    title: id,
    normalizedTitle: id,
    showings,
    performances,
    ...overrides,
  } as Movie;
}

const index = (movies: Movie[]) =>
  Object.fromEntries(movies.map((movie) => [movie.id, movie]));

const window = { start: NOW, end: NOW + 30 * DAY };

/** Filler so a venue clears MIN_VENUE_SAMPLE without any occasions of its own. */
const filler = (venueId: string, count: number) =>
  makeMovie(`filler-${venueId}`, { venues: [venueId], count });

describe("matchOccasions", () => {
  it("names the guest when the venue did", () => {
    expect(labels({ qAndA: { guests: ["Nicola Lane"] } })).toEqual([
      "Q&A with Nicola Lane",
    ]);
    expect(
      labels({ inConversation: { guests: ["Isobel Johnstone"] } }),
    ).toEqual(["In conversation with Isobel Johnstone"]);
    expect(labels({ intro: { guests: ["Benjamin Crais"] } })).toEqual([
      "Intro by Benjamin Crais",
    ]);
    expect(labels({ panel: { guests: ["Claire Nicolas"] } })).toEqual([
      "Panel with Claire Nicolas",
    ]);
    expect(labels({ guestAppearance: { guests: ["Tim Pope"] } })).toEqual([
      "With Tim Pope",
    ]);
  });

  it("joins two names and summarises more", () => {
    expect(
      labels({ qAndA: { guests: ["Nicolas Wadimoff", "Jawdat Khoudary"] } }),
    ).toEqual(["Q&A with Nicolas Wadimoff and Jawdat Khoudary"]);
    expect(
      labels({
        panel: { guests: ["Claire Nicolas", "Abla Kandalaft", "Jamal Awar"] },
      }),
    ).toEqual(["Panel with Claire Nicolas and others"]);
  });

  it("summarises two names too long for a subtitle together", () => {
    expect(
      labels({
        qAndA: {
          guests: ["Cécile Maistre-Chabrol", "Jean-Pierre Léaud-Martin"],
        },
      }),
    ).toEqual(["Q&A with Cécile Maistre-Chabrol and others"]);
  });

  it("softens a name written in capitals", () => {
    expect(labels({ qAndA: { guests: ["SAMIRA AHMED"] } })).toEqual([
      "Q&A with Samira Ahmed",
    ]);
  });

  it("uses the plain label when nobody is named", () => {
    expect(labels({ qAndA: true })).toEqual(["Q&A"]);
    expect(labels({ inConversation: true })).toEqual(["In conversation"]);
    expect(labels({ panel: true })).toEqual(["Panel discussion"]);
    expect(labels({ guestAppearance: true })).toEqual(["With a guest"]);
    expect(labels({ intro: true })).toEqual(["With an introduction"]);
  });

  it("prefers a named guest of any form to an unnamed one", () => {
    expect(labels({ qAndA: true, intro: { guests: ["Gary Lewis"] } })).toEqual([
      "Intro by Gary Lewis",
    ]);
  });

  it("reads live scores, premieres and previews", () => {
    expect(labels({ liveScore: { performers: ["Hugo Max"] } })).toEqual([
      "Live score by Hugo Max",
    ]);
    expect(labels({ liveScore: true })).toEqual(["Live score"]);
    expect(labels({ premiere: { region: "uk" } })).toEqual(["UK premiere"]);
    expect(labels({ premiere: { region: "london" } })).toEqual([
      "London premiere",
    ]);
    expect(labels({ premiere: true })).toEqual(["Premiere"]);
    expect(labels({ preview: true })).toEqual(["Preview screening"]);
  });

  it("reports one occasion per kind, most specific kind first", () => {
    const matches = matchOccasions({
      premiere: { region: "london" },
      intro: true,
      qAndA: true,
    });
    // No Intro alongside the Guest: the Q&A and the intro are one evening.
    expect(matches.map((m) => m.kind)).toEqual([
      OccasionKind.Guest,
      OccasionKind.Premiere,
    ]);
  });

  it("finds nothing in a performance with no occasions", () => {
    expect(matchOccasions(undefined)).toEqual([]);
    expect(matchOccasions({})).toEqual([]);
  });
});

describe("findOccasions", () => {
  it("reads the occasions the pipeline published", () => {
    const withOccasion = makeMovie("a", { occasions: { qAndA: true } });
    const without = makeMovie("b");

    const found = findOccasions(index([withOccasion, without]), window);
    expect(found.map((o) => [o.movie.id, o.label])).toEqual([["a", "Q&A"]]);
  });

  it("drops a signal that is house style at its venue", () => {
    // 4 of 24 performances introduced — over MAX_VENUE_SHARE, so this venue
    // introduces things as a matter of course.
    const introduced = Array.from({ length: 4 }, (_, i) =>
      makeMovie(`intro-${i}`, { occasions: { intro: true } }),
    );
    const movies = index([...introduced, filler("venue-1", 20)]);

    expect(findOccasions(movies, window)).toEqual([]);
  });

  it("keeps the same signal at a venue that rarely programmes", () => {
    // One of two screenings introduced is a 50% share, but two screenings is
    // no sample at all — and a hall that opens twice a year is the event.
    const movie = makeMovie("church", {
      venues: ["chapel"],
      occasions: { intro: true },
    });
    const other = makeMovie("other", { venues: ["chapel"] });

    const found = findOccasions(index([movie, other]), window);
    expect(found.map((o) => o.movie.id)).toEqual(["church"]);
  });

  it("ranks a guest higher when the film barely screens", () => {
    const rare = makeMovie("rare", { occasions: { qAndA: true }, count: 1 });
    const everywhere = makeMovie("everywhere", {
      occasions: { qAndA: true },
      venues: ["venue-2"],
      count: 20,
    });
    const movies = index([
      rare,
      everywhere,
      filler("venue-1", 20),
      filler("venue-2", 20),
    ]);

    expect(
      findBestOccasionPerMovie(movies, window).map((o) => o.movie.id),
    ).toEqual(["rare", "everywhere"]);
  });

  it("ranks a premiere the other way round", () => {
    // A premiere of something with a run behind it beats a one-night hire.
    const oneOff = makeMovie("one-off", {
      occasions: { premiere: { region: "uk" } },
      count: 1,
    });
    const withRun = makeMovie("with-run", {
      occasions: { premiere: { region: "uk" } },
      venues: ["venue-2"],
      count: 6,
    });
    const movies = index([
      oneOff,
      withRun,
      filler("venue-1", 20),
      filler("venue-2", 20),
    ]);

    expect(
      findBestOccasionPerMovie(movies, window).map((o) => o.movie.id),
    ).toEqual(["with-run", "one-off"]);
  });

  it("does not let a widely-screening film bury its live score", () => {
    const liveScore = makeMovie("live", {
      occasions: { liveScore: true },
      count: 8,
    });
    const guest = makeMovie("guest", {
      occasions: { qAndA: true },
      venues: ["venue-2"],
      count: 8,
    });
    const movies = index([
      liveScore,
      guest,
      filler("venue-1", 20),
      filler("venue-2", 20),
    ]);

    expect(
      findBestOccasionPerMovie(movies, window).map((o) => o.movie.id),
    ).toEqual(["live", "guest"]);
  });

  it("rewards the showing that stands out from the film's other showings", () => {
    // Both films screen eight times; only one of the first film's showings has
    // the guest, so that night is the one a reader cannot substitute.
    const standout = makeMovie("standout", {
      occasions: { qAndA: true },
      count: 8,
    });
    const everyNight = makeMovie("every-night", {
      everyPerformance: { qAndA: true },
      venues: ["venue-2"],
      count: 8,
    });
    // venue-2 needs enough other programming that eight guest nights stay
    // under the share that would mark them as house style.
    const movies = index([
      standout,
      everyNight,
      filler("venue-1", 20),
      filler("venue-2", 50),
    ]);

    expect(
      findBestOccasionPerMovie(movies, window).map((o) => o.movie.id),
    ).toEqual(["standout", "every-night"]);
  });

  it("does not penalise a film whose only showing is the occasion", () => {
    // 1:1 is not evidence against an occasion — a repertory one-off with a
    // guest looks exactly like a film that exists only as this event, and the
    // difference between them is the film, not the ratio.
    const onlyShowing = makeMovie("only", {
      occasions: { qAndA: true },
      count: 1,
    });
    const oneOfEight = makeMovie("one-of-eight", {
      occasions: { qAndA: true },
      venues: ["venue-2"],
      count: 8,
    });
    const movies = index([
      onlyShowing,
      oneOfEight,
      filler("venue-1", 20),
      filler("venue-2", 20),
    ]);

    const [first] = findBestOccasionPerMovie(movies, window);
    expect(first.movie.id).toBe("only");
  });

  it("only counts performances inside the window", () => {
    const later = makeMovie("later", { occasions: { qAndA: true } });
    later.performances[0].time = NOW + 40 * DAY;

    expect(findOccasions(index([later]), window)).toEqual([]);
  });

  it("ignores anything that isn't a film", () => {
    const quiz = makeMovie("quiz", { occasions: { qAndA: true } });
    Object.values(quiz.showings).forEach((showing) => {
      showing.category = Category.Quiz;
    });

    expect(findOccasions(index([quiz]), window)).toEqual([]);
  });
});

describe("findBestOccasionPerMovie", () => {
  it("returns each film once, at its best occasion", () => {
    const movie = makeMovie("twice", {
      everyPerformance: { qAndA: true },
      venues: ["venue-1", "venue-2"],
    });
    movie.performances[0].occasions = { liveScore: true };

    const found = findBestOccasionPerMovie(index([movie]), window);
    expect(found).toHaveLength(1);
    expect(found[0].kind).toBe(OccasionKind.LiveScore);
  });

  it("leaves out an occasion nobody can get into", () => {
    const soldOut = makeMovie("sold-out", {
      occasions: { qAndA: { guests: ["Someone Famous"] } },
      soldOut: true,
    });
    const available = makeMovie("available", {
      occasions: { intro: true },
      venues: ["venue-2"],
    });

    expect(
      findBestOccasionPerMovie(index([soldOut, available]), window).map(
        (o) => o.movie.id,
      ),
    ).toEqual(["available"]);
  });

  it("keeps a film whose other occasion night is still available", () => {
    const movie = makeMovie("two-nights", {
      occasions: { qAndA: { guests: ["Someone Famous"] } },
      soldOut: true,
    });
    // A second Q&A night at another venue, not sold out.
    const second = makeMovie("two-nights-b", {
      occasions: { qAndA: { guests: ["Someone Famous"] } },
      venues: ["venue-2"],
    });

    const found = findBestOccasionPerMovie(index([movie, second]), window);
    expect(found.map((o) => o.movie.id)).toEqual(["two-nights-b"]);
  });

  it("still reports sold-out occasions from the engine itself", () => {
    const soldOut = makeMovie("sold-out", {
      occasions: { qAndA: { guests: ["Someone Famous"] } },
      soldOut: true,
    });

    expect(findOccasions(index([soldOut]), window)).toHaveLength(1);
  });

  it("narrows to the given venues without losing a film's nearby night", () => {
    const both = makeMovie("both", {
      occasions: { qAndA: { guests: ["Someone Famous"] } },
      venues: ["far", "near"],
    });
    const farOnly = makeMovie("far-only", {
      occasions: { qAndA: { guests: ["Someone Famous"] } },
      venues: ["far"],
    });

    const found = findBestOccasionPerMovie(index([both, farOnly]), window, {
      venueIds: new Set(["near"]),
    });
    expect(found.map((o) => [o.movie.id, o.venueId])).toEqual([
      ["both", "near"],
    ]);
  });

  it("prefers variety when two venues' occasions are level", () => {
    const movies = ["a", "b"].flatMap((venue) =>
      Array.from({ length: 3 }, (_, i) =>
        makeMovie(`${venue}-${i}`, {
          occasions: { qAndA: true },
          venues: [`venue-${venue}`],
        }),
      ),
    );
    const withFiller = index([
      ...movies,
      filler("venue-a", 20),
      filler("venue-b", 20),
    ]);

    expect(
      findBestOccasionPerMovie(withFiller, window).map((o) => o.venueId),
    ).toEqual([
      "venue-a",
      "venue-b",
      "venue-a",
      "venue-b",
      "venue-a",
      "venue-b",
    ]);
  });

  it("does not give away a venue's best nights to spread itself around", () => {
    // Crowding is a tie-break, not a quota: three named guests at one venue
    // still beat an anonymous introduction somewhere else.
    const named = Array.from({ length: 3 }, (_, i) =>
      makeMovie(`named-${i}`, {
        occasions: { qAndA: { guests: [`Guest Number ${i}`] } },
        venues: ["busy"],
      }),
    );
    const elsewhere = makeMovie("elsewhere", {
      occasions: { intro: true },
      venues: ["quiet"],
    });
    const movies = index([
      ...named,
      elsewhere,
      filler("busy", 20),
      filler("quiet", 20),
    ]);

    const found = findBestOccasionPerMovie(movies, window);
    expect(found.slice(0, 3).map((o) => o.venueId)).toEqual([
      "busy",
      "busy",
      "busy",
    ]);
    expect(found[3].movie.id).toBe("elsewhere");
  });
});

describe("getOccasionTags", () => {
  it("lists every occasion, with the names the venue gave", () => {
    expect(
      getOccasionTags({
        qAndA: { guests: ["Gary Lewis"] },
        intro: true,
        premiere: { region: "uk" },
        preview: true,
      }),
    ).toEqual(["Intro", "Q&A with Gary Lewis", "UK premiere", "Preview"]);
    expect(getOccasionTags({ intro: { guests: ["Benjamin Crais"] } })).toEqual([
      "Intro by Benjamin Crais",
    ]);
    expect(
      getOccasionTags({ liveScore: { performers: ["Hugo Max"] } }),
    ).toEqual(["Live score by Hugo Max"]);
  });

  it("has nothing for a performance without occasions", () => {
    expect(getOccasionTags(undefined)).toEqual([]);
    expect(getOccasionTags({})).toEqual([]);
  });
});

describe("isNoteCoveredByOccasions", () => {
  const blueNote = {
    qAndA: { guests: ["Sophie Marceau"] },
    premiere: { region: "uk" as const },
  };

  it("leaves out a bare billing the tags say in full", () => {
    expect(isNoteCoveredByOccasions("+ Q&A", blueNote)).toBe(true);
    expect(isNoteCoveredByOccasions("Q&A", { qAndA: true })).toBe(true);
    expect(isNoteCoveredByOccasions("+ ScreenTalk", { qAndA: true })).toBe(
      true,
    );
    expect(isNoteCoveredByOccasions("UK Premiere", blueNote)).toBe(true);
    expect(isNoteCoveredByOccasions("Q&A with Sophie Marceau", blueNote)).toBe(
      true,
    );
  });

  it("needs every part of a joined billing covered", () => {
    expect(
      isNoteCoveredByOccasions("+ Intro + Q&A", { intro: true, qAndA: true }),
    ).toBe(true);
    expect(isNoteCoveredByOccasions("+ Intro + Q&A", { qAndA: true })).toBe(
      false,
    );
  });

  it("keeps a note that says more than the tags", () => {
    expect(
      isNoteCoveredByOccasions("UK Premiere of 4K Restoration", blueNote),
    ).toBe(false);
    expect(
      isNoteCoveredByOccasions("Part of French Film Festival London", blueNote),
    ).toBe(false);
    expect(
      isNoteCoveredByOccasions("Q&A with the director", { qAndA: true }),
    ).toBe(false);
  });

  it("keeps a note naming an occasion the performance doesn't have", () => {
    expect(isNoteCoveredByOccasions("+ Q&A", { intro: true })).toBe(false);
    expect(isNoteCoveredByOccasions("London Premiere", blueNote)).toBe(false);
    expect(isNoteCoveredByOccasions("+ Q&A", undefined)).toBe(false);
  });
});
