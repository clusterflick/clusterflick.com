import { describe, it, expect } from "vitest";
import {
  AccessibilityFeature,
  Category,
  type Movie,
  type MoviePerformance,
  FormatSource,
  type Genre,
  type Venue,
} from "@/types";
import {
  formatDateLong,
  getLondonMidnightTimestamp,
  MS_PER_DAY,
} from "@/utils/format-date";
import { FilterId, type FilterState, type MoviesRecord } from "./types";
import { getDefaultState, set, apply } from "./manager";
import {
  getFilterValueOffers,
  suggestFilterRelaxations,
  suggestShowingRelaxations,
  type FilterSuggestion,
} from "./suggest";
import { buildPeopleIndex } from "./modules/people";

/**
 * The date filter's default is computed from the real clock (today→+7d), so
 * fixtures are anchored to it rather than to a frozen timestamp.
 */
const TODAY = getLondonMidnightTimestamp();
const IN_WINDOW = TODAY + 2 * MS_PER_DAY;
const BEYOND_WINDOW = TODAY + 30 * MS_PER_DAY;

interface MovieSpec {
  title: string;
  /** TMDB genre ids, as the dataset stores them. */
  genres?: string[];
  /** TMDB person ids, as the dataset stores them. */
  directors?: string[];
  actors?: string[];
  /** Source format of the single performance. */
  source?: FormatSource;
  /** Original venue title, when it differs from the film title. */
  showingTitle?: string;
  category?: Category;
  venueId?: string;
  time?: number;
  notes?: string;
  subtitled?: boolean;
}

function makeMovie(id: string, spec: MovieSpec): Movie {
  const showingId = `${id}-s0`;
  const performance: MoviePerformance = {
    bookingUrl: `https://example.com/book/${showingId}`,
    showingId,
    time: spec.time ?? IN_WINDOW,
    ...(spec.notes ? { notes: spec.notes } : {}),
    ...(spec.subtitled ? { accessibility: { subtitled: true } } : {}),
    ...(spec.source ? { format: { source: spec.source } } : {}),
  };

  return {
    id,
    title: spec.title,
    normalizedTitle: spec.title.toLowerCase(),
    ...(spec.genres ? { genres: spec.genres } : {}),
    ...(spec.directors ? { directors: spec.directors } : {}),
    ...(spec.actors ? { actors: spec.actors } : {}),
    showings: {
      [showingId]: {
        id: showingId,
        category: spec.category ?? Category.Movie,
        url: `https://example.com/${showingId}`,
        venueId: spec.venueId ?? "venue-a",
        ...(spec.showingTitle ? { title: spec.showingTitle } : {}),
      },
    },
    performances: [performance],
  } as Movie;
}

function makeMovies(specs: Record<string, MovieSpec>): MoviesRecord {
  return Object.fromEntries(
    Object.entries(specs).map(([id, spec]) => [id, makeMovie(id, spec)]),
  );
}

const labels = (movies: MoviesRecord, state: FilterState) =>
  suggestFilterRelaxations({ movies, state }).map((s) => s.headline);

/** A suggestion rendered the way the UI stacks it: headline, then one line per change. */
const lines = (suggestion: FilterSuggestion): string[] => [
  suggestion.headline,
  ...suggestion.changes.map((change) =>
    change.detail ? `${change.label}: ${change.detail}` : change.label,
  ),
];

/** Lookups the detail copy needs to name categories and venues. */
const CATEGORIES = [
  { value: Category.Movie, label: "Films" },
  { value: Category.Tv, label: "TV" },
  { value: Category.Comedy, label: "Comedy" },
];

/** Genre metadata is keyed by id; the entries carry only a name. */
const GENRES = {
  "28": { name: "Action" },
  "18": { name: "Drama" },
} as unknown as Record<string, Genre>;

const VENUES = {
  "venue-a": { id: "venue-a", name: "Prince Charles Cinema" },
  "venue-b": { id: "venue-b", name: "BFI Southbank" },
} as unknown as Record<string, Venue>;

describe("suggestFilterRelaxations", () => {
  it("finds a film hidden behind the default date window", () => {
    const movies = makeMovies({
      "1": { title: "Eternal Sunshine", time: BEYOND_WINDOW },
    });
    const state = set(getDefaultState(), FilterId.Search, "Eternal Sunshine");

    expect(Object.keys(apply(movies, state))).toHaveLength(0);
    expect(suggestFilterRelaxations({ movies, state })).toEqual([
      expect.objectContaining({
        kind: "widen",
        headline: "Show “Eternal Sunshine”",
        count: 1,
      }),
    ]);
  });

  it("finds an event hidden behind the default category selection", () => {
    const movies = makeMovies({
      "1": { title: "Mr Tickle", category: Category.Tv },
    });
    const state = set(getDefaultState(), FilterId.Search, "Mr Tickle");

    expect(Object.keys(apply(movies, state))).toHaveLength(0);
    expect(labels(movies, state)).toEqual(["Show “Mr Tickle”"]);
  });

  it("returns a state that really does produce the advertised count", () => {
    const movies = makeMovies({
      "1": { title: "Eternal Sunshine", time: BEYOND_WINDOW },
      "2": { title: "Eternal Sunshine Again", time: BEYOND_WINDOW },
    });
    const state = set(getDefaultState(), FilterId.Search, "Eternal Sunshine");

    for (const suggestion of suggestFilterRelaxations({ movies, state })) {
      expect(Object.keys(apply(movies, suggestion.state))).toHaveLength(
        suggestion.count,
      );
    }
  });

  it("orders offers by elasticity, not by result count", () => {
    // Each dimension independently unblocks the search, and the date — which
    // must rank first — frees up the *fewest* results of the three.
    const movies = makeMovies({
      // Only reachable by widening the date.
      "1": {
        title: "A",
        venueId: "venue-a",
        subtitled: true,
        time: BEYOND_WINDOW,
      },
      // Only reachable by widening the venues (3 of them).
      "2": { title: "B", venueId: "venue-b", subtitled: true, time: TODAY },
      "3": { title: "C", venueId: "venue-b", subtitled: true, time: TODAY },
      "4": { title: "D", venueId: "venue-b", subtitled: true, time: TODAY },
      // Only reachable by dropping the subtitles requirement (2 of them).
      "5": { title: "E", venueId: "venue-a", time: TODAY },
      "6": { title: "F", venueId: "venue-a", time: TODAY },
    });
    let state = set(getDefaultState(), FilterId.Venues, ["venue-a"]);
    state = set(state, FilterId.Accessibility, [
      AccessibilityFeature.Subtitled,
    ]);
    state = set(state, FilterId.DateRange, { start: TODAY, end: TODAY });
    // The fixture's "today" showings are at midnight, so already started;
    // shown here, since this is about ordering rather than finished showings.
    state = set(state, FilterId.HideFinished, false);

    expect(suggestFilterRelaxations({ movies, state })).toEqual([
      expect.objectContaining({
        changes: [
          {
            label: "Any date",
            detail: `next showing ${formatDateLong(BEYOND_WINDOW)}`,
          },
        ],
        count: 1,
      }),
      expect.objectContaining({
        changes: [{ label: "All venues" }],
        count: 3,
      }),
      expect.objectContaining({
        changes: [{ label: "Any accessibility requirement" }],
        count: 2,
      }),
    ]);
  });

  it("offers the query against the original venue title when that is where it matches", () => {
    const movies = makeMovies({
      "1": {
        title: "A Separation",
        showingTitle: "Loved & Wanted: Community Film Screening",
      },
    });
    const state = set(
      getDefaultState(),
      FilterId.Search,
      "Community Film Screening",
    );

    const [suggestion] = suggestFilterRelaxations({ movies, state });
    expect(suggestion).toMatchObject({
      kind: "redirect",
      headline: "Search original venue titles instead",
      count: 1,
    });
    // The query moves rather than being duplicated.
    expect(suggestion.state[FilterId.Search]).toBe("");
    expect(suggestion.state[FilterId.ShowingTitleSearch]).toBe(
      "Community Film Screening",
    );
  });

  it("ranks a redirect above any widening", () => {
    const movies = makeMovies({
      "1": { title: "A Separation", showingTitle: "Community Film Screening" },
      "2": { title: "Community Film Screening", time: BEYOND_WINDOW },
    });
    const state = set(
      getDefaultState(),
      FilterId.Search,
      "Community Film Screening",
    );

    expect(labels(movies, state)[0]).toBe(
      "Search original venue titles instead",
    );
  });

  it("never overwrites a query the user put in the target field", () => {
    const movies = makeMovies({
      "1": { title: "A Separation", showingTitle: "Community Film Screening" },
    });
    let state = set(
      getDefaultState(),
      FilterId.Search,
      "Community Film Screening",
    );
    state = set(state, FilterId.ShowingTitleSearch, "something else");
    state = set(state, FilterId.PerformanceNotesSearch, "also taken");

    expect(
      suggestFilterRelaxations({ movies, state }).filter(
        (s) => s.kind === "redirect",
      ),
    ).toEqual([]);
  });

  describe("stale second queries", () => {
    it("offers to clear a performance note query left beside a title search", () => {
      const movies = makeMovies({
        "1": { title: "Alien", notes: "Presented in 70mm" },
        "2": { title: "Aliens" },
      });
      let state = set(
        getDefaultState(),
        FilterId.PerformanceNotesSearch,
        "Q&A",
      );
      state = set(state, FilterId.Search, "alien");

      const [suggestion] = suggestFilterRelaxations({ movies, state });
      expect(lines(suggestion)).toEqual([
        "Clear the performance note search for “Q&A”",
        "Any performance note: “Alien” & “Aliens”",
      ]);
      expect(suggestion.count).toBe(2);
      // The film title query is kept; only the stale one goes.
      expect(suggestion.state[FilterId.Search]).toBe("alien");
      expect(suggestion.state[FilterId.PerformanceNotesSearch]).toBe("");
    });

    it("offers to clear an original venue title query left beside a title search", () => {
      const movies = makeMovies({
        "1": { title: "Alien", showingTitle: "Alien (40th Anniversary)" },
      });
      let state = set(
        getDefaultState(),
        FilterId.ShowingTitleSearch,
        "Community Film Screening",
      );
      state = set(state, FilterId.Search, "alien");

      expect(labels(movies, state)).toEqual([
        "Clear the original venue title search for “Community Film Screening”",
      ]);
    });

    it("ranks clearing the stale query above any widening", () => {
      const movies = makeMovies({
        "1": { title: "Alien" },
        "2": { title: "Aliens", notes: "Q&A", time: BEYOND_WINDOW },
      });
      let state = set(
        getDefaultState(),
        FilterId.PerformanceNotesSearch,
        "Q&A",
      );
      state = set(state, FilterId.Search, "alien");

      expect(labels(movies, state)).toEqual([
        "Clear the performance note search for “Q&A”",
        "Show “Aliens”",
      ]);
    });

    it("pairs clearing the stale query with a widening", () => {
      const movies = makeMovies({
        "1": { title: "Alien", time: BEYOND_WINDOW },
      });
      let state = set(
        getDefaultState(),
        FilterId.PerformanceNotesSearch,
        "Q&A",
      );
      state = set(state, FilterId.Search, "alien");

      const [suggestion] = suggestFilterRelaxations({ movies, state });
      expect(suggestion.headline).toBe(
        "Clear the performance note search for “Q&A”",
      );
      expect(suggestion.changes.map((change) => change.label)).toEqual([
        "Any performance note",
        "Any date",
      ]);
    });

    it("never clears a second query when the film title box is empty", () => {
      const movies = makeMovies({ "1": { title: "Alien" } });
      let state = set(
        getDefaultState(),
        FilterId.PerformanceNotesSearch,
        "Q&A",
      );
      state = set(state, FilterId.ShowingTitleSearch, "alien");

      expect(
        suggestFilterRelaxations({ movies, state }).filter((s) =>
          s.id.includes(`drop:${FilterId.PerformanceNotesSearch}`),
        ),
      ).toEqual([]);
    });
  });

  it("falls back to pairs when no single change is enough", () => {
    const movies = makeMovies({
      "1": {
        title: "A Separation",
        showingTitle: "Community Film Screening",
        time: BEYOND_WINDOW,
      },
    });
    const state = set(
      getDefaultState(),
      FilterId.Search,
      "Community Film Screening",
    );

    // Both changes are stated, each on its own line, rather than run together
    // into "Search original venue titles instead, any date".
    expect(lines(suggestFilterRelaxations({ movies, state })[0])).toEqual([
      "Search original venue titles instead",
      "Original venue title: “Community Film Screening”",
      `Any date: next showing ${formatDateLong(BEYOND_WINDOW)}`,
    ]);
  });

  it("still offers a pair when a redirect already worked", () => {
    // Searching "word" finds a performance note immediately, while the film
    // actually called "Words" is both outside the date window and in an
    // excluded category — so it is reachable only as a pair. Finding the
    // redirect must not end the search.
    const movies = makeMovies({
      "1": { title: "Something", notes: "Watchword" },
      "2": { title: "Words", category: Category.Tv, time: BEYOND_WINDOW },
    });
    const state = set(getDefaultState(), FilterId.Search, "word");

    expect(labels(movies, state)).toEqual([
      "Search performance notes instead",
      "Show “Words”",
    ]);
  });

  it("skips a pair whose halves already work on their own", () => {
    // Widening the date alone is enough, so "any date, all event types" is a
    // more expensive route to results already offered.
    const movies = makeMovies({
      "1": { title: "Eternal Sunshine", time: BEYOND_WINDOW },
    });
    const state = set(getDefaultState(), FilterId.Search, "Eternal Sunshine");

    expect(labels(movies, state)).toEqual(["Show “Eternal Sunshine”"]);
  });

  it("never pairs an accessibility relaxation with anything else", () => {
    // The only way through is dropping subtitles *and* widening the date, which
    // is exactly the combination that must not be offered.
    const movies = makeMovies({ "1": { title: "A", time: BEYOND_WINDOW } });
    let state = set(getDefaultState(), FilterId.Accessibility, [
      AccessibilityFeature.Subtitled,
    ]);
    state = set(state, FilterId.HideSoldOut, true);

    for (const suggestion of suggestFilterRelaxations({ movies, state })) {
      for (const line of lines(suggestion)) {
        expect(line).not.toContain("accessibility");
      }
    }
  });

  describe("filter-value offers", () => {
    it("reads a query that names a filter value as that value", () => {
      const movies = makeMovies({
        "1": { title: "The Odyssey", source: FormatSource.SeventyMm },
      });
      const state = set(getDefaultState(), FilterId.Search, "70mm");

      const [suggestion] = suggestFilterRelaxations({ movies, state });
      expect(lines(suggestion)).toEqual([
        "Show 70mm screenings",
        "Source Format: 70mm",
      ]);
      // The query was the filter value, so it leaves the search box with it.
      expect(suggestion.state[FilterId.Search]).toBe("");
      expect(suggestion.state[FilterId.FormatSource]).toEqual([
        FormatSource.SeventyMm,
      ]);
    });

    it("offers every value the query names, not just the first", () => {
      // "70mm" is a whole word inside "IMAX 70mm" too, and the two are
      // different screenings with different counts.
      const movies = makeMovies({
        "1": { title: "A", source: FormatSource.SeventyMm },
        "2": { title: "B", source: FormatSource.ImaxSeventyMm },
      });
      const state = set(getDefaultState(), FilterId.Search, "70mm");

      expect(
        suggestFilterRelaxations({ movies, state })
          .filter((s) => s.kind === "filter")
          .map((s) => s.headline),
      ).toEqual(["Show 70mm screenings", "Show IMAX 70mm screenings"]);
    });

    it("reads a genre name, looked up by its record key", () => {
      const movies = makeMovies({
        "1": { title: "Heat", genres: ["28"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "action");

      const [suggestion] = suggestFilterRelaxations({
        movies,
        state,
        genres: GENRES,
      });
      expect(lines(suggestion)).toEqual(["Show Action films", "Genre: Action"]);
      expect(suggestion.state[FilterId.Genres]).toEqual(["28"]);
    });

    it("matches whole words only, never part of one", () => {
      // "act" inside "Action" would be a coincidence, not a request.
      const movies = makeMovies({
        "1": { title: "Heat", genres: ["28"], time: BEYOND_WINDOW },
      });
      const state = set(getDefaultState(), FilterId.Search, "act");

      expect(
        suggestFilterRelaxations({ movies, state, genres: GENRES }).filter(
          (s) => s.kind === "filter",
        ),
      ).toEqual([]);
    });

    it("does not read a query as a venue name", () => {
      // Venue names are full of ordinary words, so they are not a vocabulary.
      const movies = makeMovies({
        "1": { title: "Heat", venueId: "venue-b", time: BEYOND_WINDOW },
      });
      const state = set(getDefaultState(), FilterId.Search, "BFI Southbank");

      expect(
        suggestFilterRelaxations({ movies, state, venues: VENUES }).filter(
          (s) => s.kind === "filter",
        ),
      ).toEqual([]);
    });

    it("ranks a filter reading above a redirect", () => {
      // Both keep every word typed, but "this is a format" is the stronger
      // reading than "this is part of a venue's own title".
      const movies = makeMovies({
        "1": { title: "A", source: FormatSource.SeventyMm },
        "2": { title: "B", showingTitle: "The Odyssey (70mm)" },
      });
      const state = set(getDefaultState(), FilterId.Search, "70mm");

      expect(
        suggestFilterRelaxations({ movies, state }).map((s) => s.kind),
      ).toEqual(["filter", "redirect"]);
    });

    it("never pairs setting a filter with widening the same filter", () => {
      // Searching "Quizzes" while a subtitles requirement is on: the only quiz
      // has no subtitles, so setting the event type alone finds nothing, and
      // the engine used to pair it with *widening* the event type. Transforms
      // apply in order, so the widening won — an offer headed "Show Quizzes"
      // that actually selected every event type, subtitles still on.
      const movies = makeMovies({
        "1": { title: "Big Fat Quiz", category: Category.Quiz },
        "2": { title: "Some Film", subtitled: true, category: Category.Tv },
      });
      let state = set(getDefaultState(), FilterId.Accessibility, [
        AccessibilityFeature.Subtitled,
      ]);
      state = set(state, FilterId.Search, "Quizzes");

      for (const suggestion of suggestFilterRelaxations({
        movies,
        state,
        categories: [...CATEGORIES, { value: Category.Quiz, label: "Quizzes" }],
      })) {
        // Whatever is offered, the event type it lands on must be the one the
        // copy claims — never widened out from under it.
        if (suggestion.headline === "Show Quizzes") {
          expect(suggestion.state[FilterId.Categories]).toEqual([
            Category.Quiz,
          ]);
        }
      }
    });

    it("still offers a filter reading alongside a title match", () => {
      // Unlike a correction, this is not gated on the query matching no title:
      // "70mm" appears in showing titles and is still a format.
      const movies = makeMovies({
        "1": { title: "A", source: FormatSource.SeventyMm },
        "2": { title: "The Odyssey 70mm", time: BEYOND_WINDOW },
      });
      const state = set(getDefaultState(), FilterId.Search, "70mm");

      expect(
        suggestFilterRelaxations({ movies, state })
          .filter((s) => s.kind === "filter")
          .map((s) => s.headline),
      ).toEqual(["Show 70mm screenings"]);
    });
  });

  it.each(["subtitle", "Subtitled", "subtitles", "subs", "captioned", "SDH"])(
    "reads %s as the subtitles requirement",
    (query) => {
      // Endings fold, and the words people use that are no spelling of the
      // label at all come from aliases.
      const movies = makeMovies({
        "1": { title: "Heat", subtitled: true },
      });
      const state = set(getDefaultState(), FilterId.Search, query);

      expect(
        suggestFilterRelaxations({ movies, state })
          .filter((s) => s.kind === "filter")
          .map((s) => s.headline),
      ).toEqual(["Show Subtitles screenings"]);
    },
  );

  it("folds plurals on genre names", () => {
    const movies = makeMovies({
      "1": { title: "Heat", genres: ["18"] },
    });
    const state = set(getDefaultState(), FilterId.Search, "dramas");

    expect(
      suggestFilterRelaxations({ movies, state, genres: GENRES })
        .filter((s) => s.kind === "filter")
        .map((s) => s.headline),
    ).toEqual(["Show Drama films"]);
  });

  describe("people offers", () => {
    const index = (
      directors: {
        id: string;
        name: string;
        count: number;
        popularity?: number;
      }[],
      cast: {
        id: string;
        name: string;
        count: number;
        popularity?: number;
      }[] = [],
    ) =>
      buildPeopleIndex({
        [FilterId.Directors]: directors,
        [FilterId.Cast]: cast,
      });

    it("reads a query that names a director as that director", () => {
      const movies = makeMovies({
        "1": { title: "Taxi Driver", directors: ["d1"] },
        "2": { title: "Goodfellas", directors: ["d1"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "scorsese");

      const [suggestion] = suggestFilterRelaxations({
        movies,
        state,
        people: index([{ id: "d1", name: "Martin Scorsese", count: 2 }]),
      });
      // The headline names the films, not just the person: "Show Martin
      // Scorsese" would read as a billing rather than an instruction.
      expect(lines(suggestion)).toEqual([
        "Show films directed by Martin Scorsese",
        "Director: Martin Scorsese",
      ]);
      expect(suggestion.state[FilterId.Search]).toBe("");
      expect(suggestion.state[FilterId.Directors]).toEqual(["d1"]);
      expect(suggestion.count).toBe(2);
    });

    it("reads a query that names a cast member as that cast member", () => {
      const movies = makeMovies({ "1": { title: "Heat", actors: ["a1"] } });
      const state = set(getDefaultState(), FilterId.Search, "pacino");

      const [suggestion] = suggestFilterRelaxations({
        movies,
        state,
        people: index([], [{ id: "a1", name: "Al Pacino", count: 1 }]),
      });
      expect(suggestion.headline).toBe("Show films starring Al Pacino");
      expect(suggestion.state[FilterId.Cast]).toEqual(["a1"]);
    });

    it("matches a surname as a whole word within the full name", () => {
      const movies = makeMovies({
        "1": { title: "Ratcatcher", directors: ["d2"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "ramsay");

      expect(
        suggestFilterRelaxations({
          movies,
          state,
          people: index([{ id: "d2", name: "Lynne Ramsay", count: 1 }]),
        })
          .filter((s) => s.kind === "filter")
          .map((s) => s.headline),
      ).toEqual(["Show films directed by Lynne Ramsay"]);
    });

    it("offers a director with a single film, who has no other route", () => {
      const movies = makeMovies({
        "1": { title: "Morvern Callar", directors: ["d3"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "reygadas");

      const [suggestion] = suggestFilterRelaxations({
        movies,
        state,
        people: index([{ id: "d3", name: "Carlos Reygadas", count: 1 }]),
      });
      expect(suggestion.headline).toBe(
        "Show films directed by Carlos Reygadas",
      );
      expect(suggestion.count).toBe(1);
    });

    // A forename is 27 directors in a live release. Offering one each would
    // fill every slot in the empty state with guesses and push out the
    // widenings that would actually have helped.
    it("offers nothing when the query names more than one person in a role", () => {
      const movies = makeMovies({
        "1": { title: "Halloween", directors: ["j1"] },
        "2": { title: "Excalibur", directors: ["j2"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "john");

      expect(
        suggestFilterRelaxations({
          movies,
          state,
          people: index([
            { id: "j1", name: "John Carpenter", count: 1 },
            { id: "j2", name: "John Boorman", count: 1 },
          ]),
        }).filter((s) => s.kind === "filter"),
      ).toEqual([]);
    });

    it("offers again once the query narrows to one of them", () => {
      const movies = makeMovies({
        "1": { title: "Halloween", directors: ["j1"] },
        "2": { title: "Excalibur", directors: ["j2"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "john carpenter");

      expect(
        suggestFilterRelaxations({
          movies,
          state,
          people: index([
            { id: "j1", name: "John Carpenter", count: 1 },
            { id: "j2", name: "John Boorman", count: 1 },
          ]),
        })
          .filter((s) => s.kind === "filter")
          .map((s) => s.headline),
      ).toEqual(["Show films directed by John Carpenter"]);
    });

    // Tier 1: unique in one role, ambiguous in the other. Overwhelmingly this
    // is a unique director against a common cast forename.
    it("uses the unambiguous role when the other is contested", () => {
      const movies = makeMovies({
        "1": { title: "Stalker", directors: ["d1"], actors: ["a1", "a2"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "andrei");

      expect(
        suggestFilterRelaxations({
          movies,
          state,
          people: index(
            [{ id: "d1", name: "Andrei Tarkovsky", count: 1 }],
            [
              { id: "a1", name: "Andrei Petrov", count: 1 },
              { id: "a2", name: "Andrei Ivanov", count: 1 },
            ],
          ),
        })
          .filter((s) => s.kind === "filter")
          .map((s) => s.headline),
      ).toEqual(["Show films directed by Andrei Tarkovsky"]);
    });

    // Tier 2: two different people, so both are offered rather than one
    // guessed at — and the more-screened leads.
    it("offers both when a surname names two different people", () => {
      const movies = makeMovies({
        "1": { title: "The Godfather", actors: ["a1"] },
        "2": { title: "Heat", actors: ["a1"] },
        "3": { title: "Cinema Sabaya", directors: ["d1"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "pacino");

      const offers = suggestFilterRelaxations({
        movies,
        state,
        people: index(
          [{ id: "d1", name: "Julie Pacino", count: 1 }],
          [{ id: "a1", name: "Al Pacino", count: 2 }],
        ),
      }).filter((s) => s.kind === "filter");

      expect(offers.map((s) => s.headline)).toEqual([
        "Show films starring Al Pacino",
        "Show films directed by Julie Pacino",
      ]);
    });

    it("breaks an equal-count tie on popularity", () => {
      const movies = makeMovies({
        "1": { title: "House of 1000 Corpses", directors: ["d1"] },
        "2": { title: "The Lords of Salem", actors: ["a1"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "zombie");

      const offers = suggestFilterRelaxations({
        movies,
        state,
        people: index(
          [{ id: "d1", name: "Rob Zombie", count: 1, popularity: 80 }],
          [{ id: "a1", name: "Sheri Moon Zombie", count: 1, popularity: 30 }],
        ),
      }).filter((s) => s.kind === "filter");

      expect(offers.map((s) => s.headline)).toEqual([
        "Show films directed by Rob Zombie",
        "Show films starring Sheri Moon Zombie",
      ]);
    });

    // A release published before the pipeline emitted popularity carries none.
    it("falls back to director-first when neither carries popularity", () => {
      const movies = makeMovies({
        "1": { title: "A", directors: ["d1"] },
        "2": { title: "B", actors: ["a1"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "palma");

      expect(
        suggestFilterRelaxations({
          movies,
          state,
          people: index(
            [{ id: "d1", name: "Brian De Palma", count: 1 }],
            [{ id: "a1", name: "Rossy de Palma", count: 1 }],
          ),
        })
          .filter((s) => s.kind === "filter")
          .map((s) => s.headline),
      ).toEqual([
        "Show films directed by Brian De Palma",
        "Show films starring Rossy de Palma",
      ]);
    });

    // Tier 3: one person in two roles. Compared by name, not id — TheMovieDB
    // carries duplicate person records for the same human.
    it("offers both roles when the same name holds each, across different ids", () => {
      const movies = makeMovies({
        "1": { title: "Halloween", directors: ["d1"] },
        "2": { title: "The Fog", actors: ["a1"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "john carpenter");

      expect(
        suggestFilterRelaxations({
          movies,
          state,
          people: index(
            [{ id: "d1", name: "John Carpenter", count: 1 }],
            [{ id: "a1", name: "John Carpenter", count: 1 }],
          ),
        })
          .filter((s) => s.kind === "filter")
          .map((s) => s.headline),
      ).toEqual([
        "Show films directed by John Carpenter",
        "Show films starring John Carpenter",
      ]);
    });

    it("keeps a pair together rather than cutting it at the limit", () => {
      const movies = makeMovies({
        "1": { title: "A", directors: ["d1"] },
        "2": { title: "B", actors: ["a1"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "palma");
      const people = index(
        [{ id: "d1", name: "Brian De Palma", count: 1 }],
        [{ id: "a1", name: "Rossy de Palma", count: 1 }],
      );

      // A limit of one would otherwise present the director as the answer,
      // which is the guess the pair exists to avoid.
      const offers = suggestFilterRelaxations({
        movies,
        state,
        people,
        limit: 1,
      });
      expect(offers.map((s) => s.headline)).toEqual([
        "Show films directed by Brian De Palma",
        "Show films starring Rossy de Palma",
      ]);
    });

    // Each half is probed on its own, so one returning nothing does not drag
    // the other down with it. The pruned half can still come back in round two
    // paired with a widening — which is the right answer, since Rossy's film is
    // on, just outside the default window.
    it("probes each half of a pair independently", () => {
      const movies = makeMovies({
        "1": { title: "A", directors: ["d1"] },
        "2": { title: "B", actors: ["a1"], time: BEYOND_WINDOW },
      });
      const state = set(getDefaultState(), FilterId.Search, "palma");

      const offers = suggestFilterRelaxations({
        movies,
        state,
        people: index(
          [{ id: "d1", name: "Brian De Palma", count: 1 }],
          [{ id: "a1", name: "Rossy de Palma", count: 1 }],
        ),
      }).filter((s) => s.kind === "filter");

      expect(offers.map((s) => s.headline)).toEqual([
        "Show films directed by Brian De Palma",
        "Show films starring Rossy de Palma",
      ]);
      // The director's stands alone; the cast member's only returns anything
      // once the date window moves with it.
      expect(offers[0].changes.map((c) => c.label)).toEqual(["Director"]);
      expect(offers[1].changes.map((c) => c.label)).toEqual([
        "Cast",
        "Any date",
      ]);
    });

    it("offers nothing when no people index is passed", () => {
      const movies = makeMovies({
        "1": { title: "Taxi Driver", directors: ["d1"] },
      });
      const state = set(getDefaultState(), FilterId.Search, "scorsese");

      expect(
        suggestFilterRelaxations({ movies, state }).filter(
          (s) => s.kind === "filter",
        ),
      ).toEqual([]);
    });

    it("widens an active director filter when it is what emptied the grid", () => {
      const movies = makeMovies({
        "1": { title: "Taxi Driver", directors: ["d1"] },
      });
      // Nobody by d2 is screening, so the only way back to results is to drop
      // the name — the offer that discards the reader's stated subject, and so
      // the one that ranks below every other widening bar accessibility.
      const state = set(getDefaultState(), FilterId.Directors, ["d2"]);

      const offers = suggestFilterRelaxations({ movies, state });
      expect(offers.map((s) => s.kind)).toContain("widen");
      const widened = offers.find((s) =>
        s.changes.some((change) => change.label === "All directors"),
      );
      expect(widened?.state[FilterId.Directors]).toBeNull();
    });

    // The uniqueness rule is people-only — the formats must keep offering both
    // "70mm" and "IMAX 70mm", which is the documented behaviour there.
    it("leaves multi-match vocabularies alone", () => {
      const movies = makeMovies({
        "1": { title: "A", source: FormatSource.SeventyMm },
        "2": { title: "B", source: FormatSource.ImaxSeventyMm },
      });
      const state = set(getDefaultState(), FilterId.Search, "70mm");

      expect(
        suggestFilterRelaxations({ movies, state })
          .filter((s) => s.kind === "filter")
          .map((s) => s.headline),
      ).toEqual(["Show 70mm screenings", "Show IMAX 70mm screenings"]);
    });
  });

  describe("near-miss corrections", () => {
    it("offers the title a query was probably a mistyping of", () => {
      const movies = makeMovies({ "1": { title: "Eternal Sunshine" } });
      const state = set(getDefaultState(), FilterId.Search, "Eternl Sunshine");

      const [suggestion] = suggestFilterRelaxations({ movies, state });
      expect(suggestion).toMatchObject({
        kind: "correct",
        headline: "Did you mean “Eternal Sunshine”?",
        count: 1,
      });
      expect(suggestion.state[FilterId.Search]).toBe("Eternal Sunshine");
    });

    it("prefers a correction the current filters already show", () => {
      // "mark h" is one edit from "March" in all three. Ranked on screenings
      // alone, the festival and the talk took both slots — and the talk needs
      // two widenings, so it could never be offered — leaving the film showing
      // this week unseen.
      const movies = makeMovies({
        banff: { title: "Banff Festival - 3 March", time: BEYOND_WINDOW },
        talk: {
          title: "Mark Kermode Live",
          category: Category.Talk,
          time: BEYOND_WINDOW,
        },
        sherman: { title: "Sherman's March" },
      });
      for (const id of ["banff", "talk"]) {
        const [performance] = movies[id].performances;
        movies[id].performances.push({ ...performance }, { ...performance });
      }
      const state = set(getDefaultState(), FilterId.Search, "mark h");

      const corrections = suggestFilterRelaxations({ movies, state })
        .filter((s) => s.kind === "correct")
        .map((s) => [s.headline, s.changes.length]);
      expect(corrections).toEqual([
        ["Did you mean “Sherman's March”?", 0],
        ["Did you mean “Banff Festival - 3 March”?", 1],
      ]);
    });

    it("drops a correction no single widening could reach", () => {
      const movies = makeMovies({
        talk: {
          title: "Eternal Sunshine",
          category: Category.Talk,
          time: BEYOND_WINDOW,
        },
      });
      const state = set(getDefaultState(), FilterId.Search, "Eternl Sunshine");

      expect(
        suggestFilterRelaxations({ movies, state }).filter(
          (s) => s.kind === "correct",
        ),
      ).toEqual([]);
    });

    it("composes a correction with a widening", () => {
      // The corrected title is *also* outside the default window, so neither
      // change is enough on its own.
      const movies = makeMovies({
        "1": { title: "Eternal Sunshine", time: BEYOND_WINDOW },
      });
      const state = set(getDefaultState(), FilterId.Search, "Eternl Sunshine");

      expect(suggestFilterRelaxations({ movies, state })).toEqual([
        expect.objectContaining({
          kind: "correct",
          headline: "Did you mean “Eternal Sunshine”?",
          changes: [
            {
              label: "Any date",
              detail: `next showing ${formatDateLong(BEYOND_WINDOW)}`,
            },
          ],
          count: 1,
        }),
      ]);
    });

    it("does not second-guess a query that already matches something", () => {
      const movies = makeMovies({
        "1": { title: "Eternal Sunshine", time: BEYOND_WINDOW },
      });
      const state = set(getDefaultState(), FilterId.Search, "Eternal Sunshine");

      expect(labels(movies, state)).toEqual(["Show “Eternal Sunshine”"]);
    });

    it("does not second-guess a query that matches via a spelling variant", () => {
      // "godfather part 2" finds "The Godfather Part II" through
      // getSearchVariants, so the spelling is fine — only the date is wrong.
      const movies = makeMovies({
        "1": { title: "The Godfather Part II", time: BEYOND_WINDOW },
      });
      const state = set(getDefaultState(), FilterId.Search, "godfather part 2");

      const suggestions = suggestFilterRelaxations({ movies, state });
      expect(suggestions.map((s) => s.kind)).not.toContain("correct");
      expect(suggestions.map((s) => s.headline)).toEqual([
        "Show “The Godfather Part II”",
      ]);
    });

    it("ignores queries too short to correct", () => {
      const movies = makeMovies({ "1": { title: "Ran" } });
      const state = set(getDefaultState(), FilterId.Search, "Rin");

      expect(suggestFilterRelaxations({ movies, state })).toEqual([]);
    });

    it("corrects a transposition, which costs two plain edits", () => {
      // "bilss" → "bliss" swaps two adjacent letters. Without a transposition
      // operation this scores 2, which no five-character query can afford.
      const movies = makeMovies({
        "1": { title: "The Amazing Quest of Ernest Bliss" },
      });
      const state = set(getDefaultState(), FilterId.Search, "bilss");

      expect(labels(movies, state)).toEqual([
        "Did you mean “The Amazing Quest of Ernest Bliss”?",
      ]);
    });

    it("does not match across word boundaries", () => {
      // "ornage" sits one edit from "s for age" once spaces are stripped, and
      // used to beat the real answer. Matching whole words only, the fragment
      // is unreachable and Orange wins.
      const movies = makeMovies({
        "1": { title: "Astonishing Animated Shorts for ages 4+" },
        "2": { title: "A Clockwork Orange" },
      });
      const state = set(getDefaultState(), FilterId.Search, "ornage");

      expect(labels(movies, state)).toEqual([
        "Did you mean “A Clockwork Orange”?",
      ]);
    });

    it("does not match a fragment buried inside a longer word", () => {
      // "akera" is one edit from the "akers" inside "Filmmakers".
      const movies = makeMovies({
        "1": { title: "Notting Hill Carnival Shorts + Q&A with Filmmakers" },
      });
      const state = set(getDefaultState(), FilterId.Search, "akera");

      expect(suggestFilterRelaxations({ movies, state })).toEqual([]);
    });

    it("does not correct a four-character query against a long title", () => {
      // One edit on four characters is a 25% error rate, and a free-floating
      // substring match gives it tens of thousands of windows to land in.
      // Measured on the live data, 43% of random four-character strings drew a
      // correction at the old floor; this is the case that motivated raising it.
      const movies = makeMovies({
        "1": { title: '"El Perro del Hortelano" - Theatre Screenings' },
      });
      const state = set(getDefaultState(), FilterId.Search, "wrod");

      expect(suggestFilterRelaxations({ movies, state })).toEqual([]);
    });

    it("still corrects a five-character query", () => {
      const movies = makeMovies({ "1": { title: "Eternal Sunshine" } });
      const state = set(getDefaultState(), FilterId.Search, "etrnal");

      expect(labels(movies, state)).toEqual([
        "Did you mean “Eternal Sunshine”?",
      ]);
    });

    it("ranks a redirect above a correction", () => {
      const movies = makeMovies({
        "1": { title: "Eternal Sunshine" },
        "2": { title: "Unrelated", showingTitle: "Eternl Sunshine Special" },
      });
      const state = set(getDefaultState(), FilterId.Search, "Eternl Sunshine");

      expect(suggestFilterRelaxations({ movies, state }).map((s) => s.kind)) //
        .toEqual(["redirect", "correct"]);
    });

    it("never combines two moves that both rewrite the query", () => {
      // Correcting the query *and* re-filing it in another field would ask for
      // one spelling in one column and a different one in another. Such a pair
      // returns nothing in practice, so this guards the probe budget and the
      // copy rather than the results.
      const movies = makeMovies({
        "1": { title: "Eternal Sunshine", time: BEYOND_WINDOW },
        "2": { title: "Unrelated", showingTitle: "Eternl Sunshine Special" },
      });
      const state = set(getDefaultState(), FilterId.Search, "Eternl Sunshine");

      for (const { id } of suggestFilterRelaxations({ movies, state })) {
        const rewrites = id
          .split("+")
          .filter(
            (part) =>
              part.startsWith("redirect:") || part.startsWith("correct:"),
          );
        expect(rewrites.length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("change lines", () => {
    it("names the date a widened window would reach, relative when near", () => {
      const movies = makeMovies({
        "1": { title: "Eternal Sunshine", time: BEYOND_WINDOW },
        // A later showing must not win over the first one.
        "2": {
          title: "Eternal Sunshine Two",
          time: BEYOND_WINDOW + MS_PER_DAY,
        },
      });
      const state = set(getDefaultState(), FilterId.Search, "Eternal Sunshine");

      const [suggestion] = suggestFilterRelaxations({ movies, state });
      expect(lines(suggestion)).toEqual([
        "Show “Eternal Sunshine” & “Eternal Sunshine Two”",
        `Any date: next showing ${formatDateLong(BEYOND_WINDOW)}`,
      ]);
    });

    it("falls back to the date itself beyond a fortnight", () => {
      // Counting to "in 23 days" is harder than reading the date.
      const far = TODAY + 23 * MS_PER_DAY;
      const movies = makeMovies({
        "1": { title: "Eternal Sunshine", time: far },
      });
      const state = set(getDefaultState(), FilterId.Search, "Eternal Sunshine");

      const [suggestion] = suggestFilterRelaxations({ movies, state });
      expect(suggestion.changes).toEqual([
        { label: "Any date", detail: `next showing ${formatDateLong(far)}` },
      ]);
    });

    it("reaches for a relative day inside a fortnight", () => {
      const soon = TODAY + 8 * MS_PER_DAY;
      const movies = makeMovies({
        "1": { title: "Eternal Sunshine", time: soon },
      });
      const state = set(getDefaultState(), FilterId.Search, "Eternal Sunshine");

      const [suggestion] = suggestFilterRelaxations({ movies, state });
      expect(suggestion.changes).toEqual([
        { label: "Any date", detail: "next showing in 8 days" },
      ]);
    });

    it("names the category a widened selection would let in", () => {
      const movies = makeMovies({
        "1": { title: "Mr Tickle", category: Category.Tv },
      });
      const state = set(getDefaultState(), FilterId.Search, "Mr Tickle");

      const [suggestion] = suggestFilterRelaxations({
        movies,
        state,
        categories: CATEGORIES,
      });
      expect(suggestion.changes).toEqual([
        { label: "All event types", detail: "found in TV" },
      ]);
    });

    it("names the venues a widened selection would let in", () => {
      const movies = makeMovies({
        "1": { title: "A", venueId: "venue-b" },
      });
      const state = set(getDefaultState(), FilterId.Venues, ["venue-a"]);

      const [suggestion] = suggestFilterRelaxations({
        movies,
        state,
        venues: VENUES,
      });
      expect(suggestion.changes).toEqual([
        { label: "All venues", detail: "at BFI Southbank" },
      ]);
    });

    it("quotes the text a redirect actually matched", () => {
      const movies = makeMovies({
        "1": {
          title: "A Separation",
          showingTitle: "Loved & Wanted: Community Film Screening",
        },
      });
      const state = set(
        getDefaultState(),
        FilterId.Search,
        "Community Film Screening",
      );

      const [suggestion] = suggestFilterRelaxations({ movies, state });
      expect(lines(suggestion)).toEqual([
        "Search original venue titles instead",
        "Original venue title: “Loved & Wanted: Community Film Screening”",
      ]);
    });

    it("quotes the performance note a redirect matched", () => {
      const movies = makeMovies({
        "1": { title: "The Odyssey", notes: "Presented in 70mm" },
      });
      const state = set(getDefaultState(), FilterId.Search, "70mm");

      const redirect = suggestFilterRelaxations({ movies, state }).find(
        (s) => s.kind === "redirect",
      )!;
      expect(redirect.changes).toEqual([
        { label: "Performance note", detail: "“Presented in 70mm”" },
      ]);
    });

    it("says nothing extra about giving up an accessibility requirement", () => {
      const movies = makeMovies({ "1": { title: "A", venueId: "venue-a" } });
      const state = set(getDefaultState(), FilterId.Accessibility, [
        AccessibilityFeature.Subtitled,
      ]);

      const [suggestion] = suggestFilterRelaxations({
        movies,
        state,
        categories: CATEGORIES,
        venues: VENUES,
      });
      expect(suggestion.changes).toEqual([
        { label: "Any accessibility requirement" },
      ]);
    });

    it("falls back to bare counts when the lookups are not supplied", () => {
      const movies = makeMovies({
        "1": { title: "Mr Tickle", category: Category.Tv },
      });
      const state = set(getDefaultState(), FilterId.Search, "Mr Tickle");

      const [suggestion] = suggestFilterRelaxations({ movies, state });
      expect(suggestion.count).toBe(1);
      expect(suggestion.changes).toEqual([{ label: "All event types" }]);
    });
  });

  it("offers nothing for a state that already has results", () => {
    // The films page measures the grid against the live filters but runs this
    // on a deferred copy, so a keystroke that empties the grid used to ask for
    // rescues to the previous query — which needed none. The offers appeared,
    // vanished a frame later, and would have put the old query back if taken.
    const movies = makeMovies({ "1": { title: "Dumbo" } });
    const state = set(getDefaultState(), FilterId.Search, "dum");

    expect(Object.keys(apply(movies, state))).toHaveLength(1);
    expect(suggestFilterRelaxations({ movies, state })).toEqual([]);
  });

  it("returns nothing when the query matches nowhere in the dataset", () => {
    const movies = makeMovies({ "1": { title: "Eternal Sunshine" } });
    const state = set(getDefaultState(), FilterId.Search, "zzzzznope");

    expect(suggestFilterRelaxations({ movies, state })).toEqual([]);
  });

  it("respects the offer limit", () => {
    const movies = makeMovies({
      "1": { title: "A", time: BEYOND_WINDOW, category: Category.Tv },
      "2": { title: "B", venueId: "venue-b" },
    });
    let state = set(getDefaultState(), FilterId.Venues, ["venue-a"]);
    state = set(state, FilterId.DateRange, { start: TODAY, end: TODAY });

    expect(suggestFilterRelaxations({ movies, state, limit: 1 })).toHaveLength(
      1,
    );
  });
});

describe("getFilterValueOffers", () => {
  const offers = (movies: MoviesRecord, state: FilterState) =>
    getFilterValueOffers({
      movies,
      state,
      shownCount: Object.keys(apply(movies, state)).length,
      categories: CATEGORIES,
      genres: GENRES,
    });

  it("offers the filter reading when it returns more than the titles", () => {
    const movies = makeMovies({
      "1": { title: "Action Point" },
      "2": { title: "Heat", genres: ["28"] },
      "3": { title: "Ronin", genres: ["28"] },
    });
    const state = set(getDefaultState(), FilterId.Search, "action");

    const [offer, ...rest] = offers(movies, state);
    expect(rest).toEqual([]);
    expect(lines(offer)).toEqual(["Show Action films", "Genre: Action"]);
    expect(offer.count).toBe(2);
    expect(offer.state[FilterId.Search]).toBe("");
  });

  it("stays quiet when the titles are the bigger answer", () => {
    const movies = makeMovies({
      "1": { title: "Action Point" },
      "2": { title: "Action Jackson" },
      "3": { title: "Heat", genres: ["28"] },
    });
    const state = set(getDefaultState(), FilterId.Search, "action");

    expect(offers(movies, state)).toEqual([]);
  });

  it("stays quiet on an empty grid, which the relaxation engine owns", () => {
    const movies = makeMovies({
      "1": { title: "Heat", genres: ["28"] },
    });
    const state = set(getDefaultState(), FilterId.Search, "action");

    expect(offers(movies, state)).toEqual([]);
  });

  it("never offers a value the filter already has selected", () => {
    const movies = makeMovies({
      "1": { title: "Action Point", genres: ["28"] },
      "2": { title: "Heat", genres: ["28"] },
    });
    let state = set(getDefaultState(), FilterId.Genres, ["28"]);
    state = set(state, FilterId.Search, "action");

    expect(offers(movies, state)).toEqual([]);
  });

  it("never offers a format's default value", () => {
    // Every screening without a recorded format is Digital, so the reading
    // always "wins" and is never what the query meant.
    const movies = makeMovies({
      "1": { title: "Digital Dreams" },
      "2": { title: "Heat" },
    });
    const state = set(getDefaultState(), FilterId.Search, "digital");

    expect(offers(movies, state)).toEqual([]);
  });
});

describe("suggestShowingRelaxations", () => {
  /** A film with one performance at each of the given times. */
  const filmAt = (spec: MovieSpec, times: number[]): Movie => {
    const movie = makeMovie("1", spec);
    const [performance] = movie.performances;
    return {
      ...movie,
      performances: times.map((time) => ({ ...performance, time })),
    };
  };

  it("names the date as the blocker, with the next showing", () => {
    const movie = filmAt({ title: "Eternal Sunshine" }, [BEYOND_WINDOW]);
    const state = getDefaultState();

    const [suggestion] = suggestShowingRelaxations({ movie, state });
    expect(lines(suggestion)).toEqual([
      "Search all dates",
      `Any date: next showing ${formatDateLong(BEYOND_WINDOW)}`,
    ]);
  });

  it("counts showings rather than films", () => {
    // In films every offer would read "1 result": the film on screen.
    const movie = filmAt({ title: "A" }, [
      BEYOND_WINDOW,
      BEYOND_WINDOW + MS_PER_DAY,
      BEYOND_WINDOW + 2 * MS_PER_DAY,
    ]);

    const [suggestion] = suggestShowingRelaxations({
      movie,
      state: getDefaultState(),
    });
    expect(suggestion.count).toBe(3);
  });

  it("returns a state that really does reveal the advertised showings", () => {
    const movie = filmAt({ title: "A", venueId: "venue-b" }, [
      BEYOND_WINDOW,
      BEYOND_WINDOW + MS_PER_DAY,
    ]);
    const state = set(getDefaultState(), FilterId.Venues, ["venue-a"]);

    const suggestions = suggestShowingRelaxations({ movie, state });
    expect(suggestions).not.toHaveLength(0);
    for (const suggestion of suggestions) {
      const result = apply({ [movie.id]: movie }, suggestion.state);
      expect(result[movie.id].performances).toHaveLength(suggestion.count);
    }
  });

  it("offers nothing when the film already has showings", () => {
    const movie = filmAt({ title: "A" }, [IN_WINDOW]);

    expect(
      suggestShowingRelaxations({ movie, state: getDefaultState() }),
    ).toEqual([]);
  });

  it("phrases a pair as both actions, one change line each", () => {
    const movie = filmAt({ title: "A", venueId: "venue-b" }, [BEYOND_WINDOW]);
    const state = set(getDefaultState(), FilterId.Venues, ["venue-a"]);

    const suggestions = suggestShowingRelaxations({
      movie,
      state,
      venues: VENUES,
    });
    expect(suggestions.map(lines)).toEqual([
      [
        "Search all dates and search all venues",
        `Any date: next showing ${formatDateLong(BEYOND_WINDOW)}`,
        "All venues: at BFI Southbank",
      ],
    ]);
  });

  it("offers to clear a query left over from the films grid", () => {
    const movie = filmAt({ title: "Dumbo" }, [IN_WINDOW]);
    const state = set(
      getDefaultState(),
      FilterId.PerformanceNotesSearch,
      "Q&A",
    );

    expect(suggestShowingRelaxations({ movie, state }).map(lines)).toEqual([
      ["Clear the performance note search for “Q&A”"],
    ]);
  });

  it("never offers a redirect, correction or filter-value reading", () => {
    // "action" names a genre and is one edit from nothing here, but the page's
    // subject is fixed: the only reading left is that the query is in the way.
    const movie = filmAt({ title: "Dumbo", genres: ["28"] }, [IN_WINDOW]);
    const state = set(getDefaultState(), FilterId.Search, "action");

    const suggestions = suggestShowingRelaxations({
      movie,
      state,
      genres: GENRES,
    });
    expect(suggestions.map((s) => s.headline)).toEqual([
      "Clear the film title search for “action”",
    ]);
    expect(suggestions.every((s) => s.kind === "widen")).toBe(true);
  });

  it("never pairs an accessibility requirement with anything else", () => {
    // Only dropping subtitles *and* widening the date reveals anything, which
    // is exactly the combination that must not be offered.
    const movie = filmAt({ title: "A" }, [BEYOND_WINDOW]);
    const state = set(getDefaultState(), FilterId.Accessibility, [
      AccessibilityFeature.Subtitled,
    ]);

    expect(suggestShowingRelaxations({ movie, state, limit: 10 })).toEqual([]);
  });
});
