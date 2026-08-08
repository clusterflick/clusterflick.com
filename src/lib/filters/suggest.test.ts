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
import { suggestFilterRelaxations, type FilterSuggestion } from "./suggest";

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
