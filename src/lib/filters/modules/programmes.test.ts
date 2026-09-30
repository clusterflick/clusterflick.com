import { describe, it, expect } from "vitest";
import { Category, type Movie, type MoviePerformance } from "@/types";
import { FilterId, type FilterState, type MoviesRecord } from "../types";
import {
  apply,
  getBrowseAllState,
  getDefaultState,
  resolveFilterStateFromUrl,
  set,
  buildFilterUrl,
  matchAny,
} from "../manager";
import {
  buildProgrammeFilter,
  getProgrammeFilterUrl,
  PROGRAMME_GROUPS,
} from "./programmes";

const DAY = 86_400_000;
const soon = Date.now() + DAY;

type ShowingSpec = {
  venueId: string;
  title?: string;
  notes?: string;
  time?: number;
  category?: Category;
};

/** A film showing once at each of the given venues. */
function makeMovie(id: string, title: string, specs: ShowingSpec[]): Movie {
  const showings: Movie["showings"] = {};
  const performances: MoviePerformance[] = [];
  specs.forEach((spec, index) => {
    const showingId = `${id}-${spec.venueId}-${index}`;
    showings[showingId] = {
      id: showingId,
      category: spec.category ?? Category.Movie,
      url: `https://example.com/${showingId}`,
      venueId: spec.venueId,
      ...(spec.title ? { title: spec.title } : {}),
    };
    performances.push({
      showingId,
      bookingUrl: `https://example.com/book/${showingId}`,
      time: spec.time ?? soon,
      ...(spec.notes ? { notes: spec.notes } : {}),
    });
  });
  return {
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    showings,
    performances,
  } as Movie;
}

// Showing at the Phoenix as the club's own listing, and at the Rio as a
// regular screening — only the first is the club's.
const shallWeDance = makeMovie("1", "Shall We Dance?", [
  {
    venueId: "phoenixcinema.co.uk",
    title: "Japanese Film Club: Shall We Dance?",
  },
  { venueId: "riocinema.org.uk" },
]);
const cinebugShort = makeMovie("2", "Shorts Night", [
  {
    venueId: "venue-a",
    title: "Cinebug: Shorts Night",
    category: Category.Shorts,
  },
]);
const flareFilm = makeMovie("3", "Pride", [
  { venueId: "bfi.org.uk-southbank", notes: "Part of the BFI Flare festival" },
  {
    venueId: "bfi.org.uk-southbank",
    notes: "Part of the BFI Flare festival. Japanese Film Club",
  },
]);
const unrelated = makeMovie("4", "Heat", [{ venueId: "venue-a" }]);

const MOVIES: MoviesRecord = {
  "1": shallWeDance,
  "2": cinebugShort,
  "3": flareFilm,
  "4": unrelated,
};

const withProgrammes = (
  filmClubs: string[] | null,
  festivals: string[] | null = null,
  base: FilterState = getBrowseAllState(),
) =>
  set(set(base, FilterId.FilmClubs, filmClubs), FilterId.Festivals, festivals);

const venuesOf = (movie: Movie) =>
  Object.values(movie.showings).map((showing) => showing.venueId);

describe("film club and festival filters", () => {
  it("restricts to the club's showings, not the whole film", () => {
    const result = apply(MOVIES, withProgrammes(["japanese-film-club"]));

    expect(Object.keys(result).sort()).toEqual(["1", "3"]);
    expect(venuesOf(result["1"])).toEqual(["phoenixcinema.co.uk"]);
    expect(result["3"].performances).toHaveLength(1);
  });

  it("reads a selection within one filter as 'or'", () => {
    const result = apply(
      MOVIES,
      withProgrammes(["japanese-film-club", "cinebug"]),
    );
    expect(Object.keys(result).sort()).toEqual(["1", "2", "3"]);
  });

  // Like directors and cast: a club's screenings that are part of a festival.
  it("reads a club and a festival together as 'and'", () => {
    const result = apply(
      MOVIES,
      withProgrammes(["japanese-film-club"], ["bfi-flare"]),
    );
    expect(Object.keys(result)).toEqual(["3"]);
    expect(result["3"].performances).toHaveLength(1);
  });

  it("narrows further with every other filter", () => {
    const state = set(
      withProgrammes(["japanese-film-club", "cinebug"]),
      FilterId.Categories,
      [Category.Shorts],
    );
    expect(Object.keys(apply(MOVIES, state))).toEqual(["2"]);
  });

  // The page wrapper prunes finished showings itself; inside the grid that is
  // the reader's hide-finished setting to decide.
  it("leaves finished showings to the hide-finished setting", () => {
    const finished = {
      "1": makeMovie("1", "Shall We Dance?", [
        {
          venueId: "phoenixcinema.co.uk",
          title: "Japanese Film Club: Shall We Dance?",
          time: Date.now() - DAY,
        },
      ]),
    };
    const state = withProgrammes(["japanese-film-club"]);

    expect(apply(finished, state)).toEqual({});
    expect(
      Object.keys(apply(finished, set(state, FilterId.HideFinished, false))),
    ).toEqual(["1"]);
  });

  it("keeps ids the registry doesn't hold, which match nothing", () => {
    expect(apply(MOVIES, withProgrammes(["gone"]))).toEqual({});
    expect(
      Object.keys(apply(MOVIES, withProgrammes(["gone", "cinebug"]))),
    ).toEqual(["2"]);
  });

  it("treats an empty selection as no filter", () => {
    expect(Object.keys(apply(MOVIES, withProgrammes([], [])))).toHaveLength(4);
  });

  // The festival filter's matcher cache is keyed on the record the club filter
  // hands it, so a fresh record on every keystroke would re-run every matcher.
  it("hands the rest of the pipeline the same record on every pass", () => {
    let runs = 0;
    const filter = buildProgrammeFilter(
      PROGRAMME_GROUPS[0],
      (matchers, movies) => {
        runs += 1;
        return matchAny(matchers, movies);
      },
    );
    const state = withProgrammes(["japanese-film-club", "cinebug"]);

    const first = filter.apply(MOVIES, state);
    const again = filter.apply(MOVIES, {
      ...state,
      [FilterId.FilmClubs]: ["cinebug", "japanese-film-club"],
    });

    expect(again).toBe(first);
    expect(runs).toBe(2);
  });
});

describe("film club and festival URL params", () => {
  it("round-trips through a shared link", () => {
    const state = withProgrammes(
      ["japanese-film-club", "cinebug"],
      ["bfi-flare"],
    );
    // Outside a browser the link is just its query string.
    const url = new URL(buildFilterUrl(state), "https://clusterflick.com");

    expect(url.searchParams.get("filmClubs")).toBe(
      "japanese-film-club,cinebug",
    );
    expect(url.searchParams.get("festivals")).toBe("bfi-flare");

    const resolved = resolveFilterStateFromUrl(url.search, getDefaultState());
    expect(resolved?.[FilterId.FilmClubs]).toEqual([
      "japanese-film-club",
      "cinebug",
    ]);
    expect(resolved?.[FilterId.Festivals]).toEqual(["bfi-flare"]);
  });

  it("normalises an empty or repeated param", () => {
    const empty = resolveFilterStateFromUrl("?filmClubs=", getDefaultState());
    expect(empty?.[FilterId.FilmClubs]).toBeNull();

    const repeated = resolveFilterStateFromUrl(
      "?filmClubs=cinebug,cinebug",
      getDefaultState(),
    );
    expect(repeated?.[FilterId.FilmClubs]).toEqual(["cinebug"]);
  });

  it("links to every category and date", () => {
    const link = getProgrammeFilterUrl(
      "/planner",
      FilterId.Festivals,
      "bfi-flare",
    );
    expect(link).toBe("/planner?base=all&festivals=bfi-flare");

    const resolved = resolveFilterStateFromUrl(
      link.slice(link.indexOf("?")),
      getDefaultState(),
    );
    expect(resolved?.[FilterId.Categories]).toBeNull();
    expect(resolved?.[FilterId.DateRange]).toEqual({ start: null, end: null });
  });
});
