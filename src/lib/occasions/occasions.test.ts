import { describe, it, expect } from "vitest";
import { Category, type Movie } from "@/types";
import { matchOccasions, OccasionKind } from "./rules";
import { findOccasions, findBestOccasionPerMovie } from "./index";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000; // 2023-11-14

const labels = (text: string) => matchOccasions(text).map((m) => m.label);

/**
 * A film with one showing per venue and `count` performances at each, the
 * first of which carries `notes`. `title` is the venue's own showing title.
 */
function makeMovie(
  id: string,
  {
    venues = ["venue-1"],
    count = 1,
    title,
    notes,
    soldOut = false,
    ...overrides
  }: {
    venues?: string[];
    count?: number;
    title?: string;
    notes?: string;
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
      title,
      category: Category.Movie,
      url: `https://example.com/${showingId}`,
      venueId,
    };
    for (let i = 0; i < count; i++) {
      performances.push({
        bookingUrl: `https://example.com/book/${showingId}-${i}`,
        showingId,
        time: NOW + DAY + i * DAY,
        notes: i === 0 ? notes : undefined,
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
  it("names the guest when the listing does", () => {
    expect(labels("Nightshift + Q&A with Nicola Lane")).toEqual([
      "Q&A with Nicola Lane",
    ]);
    expect(
      labels("Siticulosa + Maeve Brennan in conversation with Isobel"),
    ).toEqual(["In conversation with Isobel"]);
    expect(
      labels("Saturday Night Fever + intro by Ruby McGuigan, BFI"),
    ).toEqual(["Intro by Ruby McGuigan"]);
  });

  it("stops a name at the end of the field", () => {
    // Title and notes are joined, so without a hard stop the capture runs on.
    const text =
      "A HARD DAY'S NIGHT + LIVE Q&A WITH SAMIRA AHMED \n This screening features a special in person Q&A appearance";
    expect(labels(text)).toEqual(["Q&A with Samira Ahmed"]);
  });

  it("falls back to the plain label when the capture isn't a name", () => {
    expect(labels("Q&A with tickets available on the door")).toEqual(["Q&A"]);
  });

  it("reads a stated role as a person in the room", () => {
    expect(labels("But I'm a Cheerleader + Director Intro")).toEqual([
      "Director Q&A",
    ]);
  });

  it("ignores an introduction that isn't happening in the room", () => {
    expect(
      labels("My Brother's Wedding + pre-recorded intro by Charles Burnett"),
    ).toEqual([]);
  });

  it("keeps a live score even when the intro is pre-recorded", () => {
    expect(
      labels("The Lodger + Live Score by Hugo Max, with a pre-recorded intro"),
    ).toEqual(["Live score by Hugo Max"]);
  });

  it("ignores chain preview pricing", () => {
    expect(
      labels("Members' Only Morning Previews - Tickets are £5 for members"),
    ).toEqual([]);
    expect(labels("Preview: Babystar")).toEqual(["Preview screening"]);
  });

  it("reports one occasion per kind, most specific kind first", () => {
    const matches = matchOccasions(
      "The Botanist (London Premiere) + Intro + Q&A",
    );
    // No Intro alongside the Guest: the Q&A and the intro are one evening.
    expect(matches.map((m) => m.kind)).toEqual([
      OccasionKind.Guest,
      OccasionKind.Premiere,
    ]);
    expect(matches[1].label).toBe("London premiere");
  });

  it("normalises a region but not a mixed-case name", () => {
    expect(labels("UK PREMIERE In-I In Motion")).toEqual(["UK premiere"]);
  });
});

describe("findOccasions", () => {
  it("finds an occasion across the showing title and the notes alike", () => {
    const fromTitle = makeMovie("a", { title: "Niagara + Q&A" });
    const fromNotes = makeMovie("b", {
      notes: "The screening will be followed by a Q&A",
    });

    const found = findOccasions(index([fromTitle, fromNotes]), window);
    expect(found.map((o) => o.movie.id).sort()).toEqual(["a", "b"]);
  });

  it("drops a signal that is house style at its venue", () => {
    // 4 of 24 performances introduced — over MAX_VENUE_SHARE, so this venue
    // introduces things as a matter of course.
    const introduced = Array.from({ length: 4 }, (_, i) =>
      makeMovie(`intro-${i}`, { notes: "The screening will be introduced." }),
    );
    const movies = index([...introduced, filler("venue-1", 20)]);

    expect(findOccasions(movies, window)).toEqual([]);
  });

  it("keeps the same signal at a venue that rarely programmes", () => {
    // One of two screenings introduced is a 50% share, but two screenings is
    // no sample at all — and a hall that opens twice a year is the event.
    const movie = makeMovie("church", {
      venues: ["chapel"],
      notes: "The screening will be introduced.",
    });
    const other = makeMovie("other", { venues: ["chapel"] });

    const found = findOccasions(index([movie, other]), window);
    expect(found.map((o) => o.movie.id)).toEqual(["church"]);
  });

  it("ranks a guest higher when the film barely screens", () => {
    const rare = makeMovie("rare", { notes: "Followed by a Q&A", count: 1 });
    const everywhere = makeMovie("everywhere", {
      notes: "Followed by a Q&A",
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
    const oneOff = makeMovie("one-off", { notes: "UK Premiere", count: 1 });
    const withRun = makeMovie("with-run", {
      notes: "UK Premiere",
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
    const liveScore = makeMovie("live", { notes: "Live score", count: 8 });
    const guest = makeMovie("guest", {
      notes: "Followed by a Q&A",
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
      notes: "Followed by a Q&A",
      count: 8,
    });
    const everyNight = makeMovie("every-night", {
      title: "Every Night + Q&A",
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
      notes: "Followed by a Q&A",
      count: 1,
    });
    const oneOfEight = makeMovie("one-of-eight", {
      notes: "Followed by a Q&A",
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
    const later = makeMovie("later", { title: "Later + Q&A" });
    later.performances[0].time = NOW + 40 * DAY;

    expect(findOccasions(index([later]), window)).toEqual([]);
  });

  it("ignores anything that isn't a film", () => {
    const quiz = makeMovie("quiz", { title: "Film Quiz + Q&A" });
    Object.values(quiz.showings).forEach((showing) => {
      showing.category = Category.Quiz;
    });

    expect(findOccasions(index([quiz]), window)).toEqual([]);
  });
});

describe("findBestOccasionPerMovie", () => {
  it("returns each film once, at its best occasion", () => {
    const movie = makeMovie("twice", {
      title: "Twice + Q&A",
      venues: ["venue-1", "venue-2"],
    });
    Object.values(movie.showings)[0].title = "Twice + live score";

    const found = findBestOccasionPerMovie(index([movie]), window);
    expect(found).toHaveLength(1);
    expect(found[0].kind).toBe(OccasionKind.LiveScore);
  });

  it("leaves out an occasion nobody can get into", () => {
    const soldOut = makeMovie("sold-out", {
      notes: "Q&A with Someone Famous",
      soldOut: true,
    });
    const available = makeMovie("available", {
      notes: "The screening will be introduced.",
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
      notes: "Q&A with Someone Famous",
      soldOut: true,
    });
    // A second Q&A night at another venue, not sold out.
    const second = makeMovie("two-nights-b", {
      notes: "Q&A with Someone Famous",
      venues: ["venue-2"],
    });

    const found = findBestOccasionPerMovie(index([movie, second]), window);
    expect(found.map((o) => o.movie.id)).toEqual(["two-nights-b"]);
  });

  it("still reports sold-out occasions from the engine itself", () => {
    const soldOut = makeMovie("sold-out", {
      notes: "Q&A with Someone Famous",
      soldOut: true,
    });

    expect(findOccasions(index([soldOut]), window)).toHaveLength(1);
  });

  it("prefers variety when two venues' occasions are level", () => {
    const movies = ["a", "b"].flatMap((venue) =>
      Array.from({ length: 3 }, (_, i) =>
        makeMovie(`${venue}-${i}`, {
          notes: "Followed by a Q&A",
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
        notes: `Q&A with Guest Number ${i}`,
        venues: ["busy"],
      }),
    );
    const elsewhere = makeMovie("elsewhere", {
      notes: "The screening will be introduced.",
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
