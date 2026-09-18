import { describe, it, expect } from "vitest";
import { Category, type Movie, type MoviePerformance } from "@/types";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import { FilterId, type FilterState, type MoviesRecord } from "../types";
import {
  getDefaultState,
  set,
  apply,
  hasActiveFilters,
  getRestrictiveFilterIds,
  resolveFilterStateFromUrl,
  buildFilterUrl,
} from "../manager";
import {
  directorsFilter,
  castFilter,
  getPeopleVocabulary,
  buildPeopleIndex,
  resolvePeopleQuery,
  PersonOption,
} from "./people";
import { normalizeForSearch } from "../normalize";

const IN_WINDOW = getLondonMidnightTimestamp() + 2 * MS_PER_DAY;

interface MovieSpec {
  title: string;
  directors?: string[];
  actors?: string[];
}

function makeMovie(id: string, spec: MovieSpec): Movie {
  const showingId = `${id}-s0`;
  const performance: MoviePerformance = {
    bookingUrl: `https://example.com/book/${showingId}`,
    showingId,
    time: IN_WINDOW,
  };

  return {
    id,
    title: spec.title,
    normalizedTitle: spec.title.toLowerCase(),
    ...(spec.directors ? { directors: spec.directors } : {}),
    ...(spec.actors ? { actors: spec.actors } : {}),
    showings: {
      [showingId]: {
        id: showingId,
        category: Category.Movie,
        url: `https://example.com/${showingId}`,
        venueId: "venue-a",
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

const MOVIES = makeMovies({
  "1": { title: "Taxi Driver", directors: ["d1"], actors: ["a1", "a2"] },
  "2": { title: "Goodfellas", directors: ["d1"], actors: ["a2"] },
  "3": { title: "Blue Velvet", directors: ["d2"], actors: ["a3"] },
  "4": { title: "Untitled" },
});

const PEOPLE = {
  d1: { name: "Martin Scorsese" },
  d2: { name: "David Lynch" },
  a1: { name: "Robert De Niro" },
  a2: { name: "Joe Pesci" },
  a3: { name: "Isabella Rossellini" },
};

const withDirectors = (ids: string[] | null): FilterState =>
  set(getDefaultState(), FilterId.Directors, ids);

const idsIn = (movies: MoviesRecord) => Object.keys(movies).sort();

describe("people filter modules", () => {
  it("keeps only films crediting a selected director", () => {
    expect(idsIn(apply(MOVIES, withDirectors(["d1"])))).toEqual(["1", "2"]);
  });

  it("unions across several selected people rather than intersecting", () => {
    expect(idsIn(apply(MOVIES, withDirectors(["d1", "d2"])))).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("reads the cast filter off the movie's `actors` field", () => {
    const state = set(getDefaultState(), FilterId.Cast, ["a2"]);
    expect(idsIn(apply(MOVIES, state))).toEqual(["1", "2"]);
  });

  it("combines the two groups as an intersection", () => {
    const state = set(withDirectors(["d1"]), FilterId.Cast, ["a1"]);
    expect(idsIn(apply(MOVIES, state))).toEqual(["1"]);
  });

  it("leaves films with no credits out of a filtered result", () => {
    expect(idsIn(apply(MOVIES, withDirectors(["d1"])))).not.toContain("4");
  });

  // The semantics that differ from the genres filter, and the reason they do:
  // an empty selection is what removing the last name leaves behind, so it must
  // be the unfiltered state rather than a grid with no way out.
  describe("empty selection means no filter, not no results", () => {
    it("returns every film for an empty array", () => {
      expect(idsIn(apply(MOVIES, withDirectors([])))).toEqual([
        "1",
        "2",
        "3",
        "4",
      ]);
    });

    it("reports itself inactive for both null and an empty array", () => {
      expect(hasActiveFilters(withDirectors(null))).toBe(false);
      expect(hasActiveFilters(withDirectors([]))).toBe(false);
      expect(hasActiveFilters(withDirectors(["d1"]))).toBe(true);
    });

    it("normalises an empty URL param to null", () => {
      const params = new URLSearchParams("directors=");
      expect(directorsFilter.fromUrlParams(params)).toBeNull();
    });

    it("does not report an empty param as restrictive", () => {
      // A state that filters nothing must not draw a "widen" suggestion.
      const state = resolveFilterStateFromUrl(
        "?base=all&directors=",
        getDefaultState(),
      )!;
      expect(getRestrictiveFilterIds(state)).not.toContain(FilterId.Directors);
    });
  });

  describe("url params", () => {
    it("round-trips a selection", () => {
      const state = set(withDirectors(["d1", "d2"]), FilterId.Cast, ["a3"]);
      const url = buildFilterUrl(state);
      const resolved = resolveFilterStateFromUrl(
        url.slice(url.indexOf("?")),
        getDefaultState(),
      )!;
      expect(resolved.directors).toEqual(["d1", "d2"]);
      expect(resolved.cast).toEqual(["a3"]);
    });

    it("writes nothing when not filtering", () => {
      const params = new URLSearchParams();
      directorsFilter.toUrlParams(withDirectors(null), params);
      castFilter.toUrlParams(withDirectors(null), params);
      expect(params.toString()).toBe("");
    });

    it("skips blank entries in a hand-written param", () => {
      const params = new URLSearchParams("directors=d1,,d2");
      expect(directorsFilter.fromUrlParams(params)).toEqual(["d1", "d2"]);
    });

    it("returns undefined when the param is absent, so the base stands", () => {
      expect(directorsFilter.fromUrlParams(new URLSearchParams())).toBe(
        undefined,
      );
    });
  });
});

describe("getPeopleVocabulary", () => {
  it("splits directors from cast, which the flat people lookup cannot", () => {
    const vocabulary = getPeopleVocabulary(MOVIES, PEOPLE);
    expect(vocabulary[FilterId.Directors].map(({ id }) => id)).toEqual([
      "d1",
      "d2",
    ]);
    expect(vocabulary[FilterId.Cast].map(({ id }) => id).sort()).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
  });

  it("counts the films each person is credited on", () => {
    const vocabulary = getPeopleVocabulary(MOVIES, PEOPLE);
    expect(vocabulary[FilterId.Directors][0]).toEqual({
      id: "d1",
      name: "Martin Scorsese",
      count: 2,
    });
  });

  it("orders by credit count, then by name", () => {
    const movies = makeMovies({
      "1": { title: "A", directors: ["zed", "amy"] },
      "2": { title: "B", directors: ["busy"] },
      "3": { title: "C", directors: ["busy"] },
    });
    const people = {
      busy: { name: "Busy Director" },
      amy: { name: "Amy" },
      zed: { name: "Zed" },
    };
    expect(
      getPeopleVocabulary(movies, people)[FilterId.Directors].map(
        ({ name }) => name,
      ),
    ).toEqual(["Busy Director", "Amy", "Zed"]);
  });

  it("counts a film once for a person credited on it twice", () => {
    const movies = makeMovies({ "1": { title: "A", directors: ["d1", "d1"] } });
    expect(
      getPeopleVocabulary(movies, PEOPLE)[FilterId.Directors][0].count,
    ).toBe(1);
  });

  it("drops credits with no name, which could not be rendered anyway", () => {
    const movies = makeMovies({
      "1": { title: "A", directors: ["d1", "unknown"] },
    });
    expect(
      getPeopleVocabulary(movies, PEOPLE)[FilterId.Directors].map(
        ({ id }) => id,
      ),
    ).toEqual(["d1"]);
  });

  it("returns empty groups rather than throwing without a lookup", () => {
    const vocabulary = getPeopleVocabulary(MOVIES, null);
    expect(vocabulary[FilterId.Directors]).toEqual([]);
    expect(vocabulary[FilterId.Cast]).toEqual([]);
  });
});

describe("resolvePeopleQuery", () => {
  const p = (
    id: string,
    name: string,
    count: number,
    popularity?: number,
  ): PersonOption => ({
    id,
    name,
    count,
    ...(popularity === undefined ? {} : { popularity }),
  });

  const resolve = (
    needle: string,
    directors: PersonOption[],
    cast: PersonOption[] = [],
  ) =>
    resolvePeopleQuery(
      // The engine hands this in already folded; mirror that here.
      normalizeForSearch(needle),
      buildPeopleIndex({
        [FilterId.Directors]: directors,
        [FilterId.Cast]: cast,
      }),
    ).map(({ person, group }) => `${group.label}:${person.name}`);

  it("indexes every whole-word run of a name", () => {
    const directors = [p("d1", "Jean-Pierre Jeunet", 1)];
    for (const needle of ["jean", "pierre", "jeunet", "jeanpierre"]) {
      expect(resolve(needle, directors)).toEqual([
        "Director:Jean-Pierre Jeunet",
      ]);
    }
    expect(resolve("jeun", directors)).toEqual([]);
  });

  it("counts a name repeated within itself once", () => {
    // Otherwise "John John" claims "john" twice and reads as two people.
    expect(resolve("john", [p("d1", "John John", 1)])).toEqual([
      "Director:John John",
    ]);
  });

  describe("tier 1 — unique in one role", () => {
    it("uses the role that is unambiguous", () => {
      expect(
        resolve(
          "andrei",
          [p("d1", "Andrei Tarkovsky", 1)],
          [p("a1", "Andrei Petrov", 1), p("a2", "Andrei Ivanov", 1)],
        ),
      ).toEqual(["Director:Andrei Tarkovsky"]);
    });

    it("works in the other direction too", () => {
      expect(
        resolve(
          "smith",
          [p("d1", "A Smith", 1), p("d2", "B Smith", 1)],
          [p("a1", "Maggie Smith", 1)],
        ),
      ).toEqual(["Cast:Maggie Smith"]);
    });
  });

  describe("tier 2 — two different people", () => {
    it("offers both rather than guessing between them", () => {
      expect(
        resolve(
          "ridley",
          [p("d1", "Ridley Scott", 7)],
          [p("a1", "Judith Ridley", 1)],
        ),
      ).toEqual(["Director:Ridley Scott", "Cast:Judith Ridley"]);
    });

    it("leads with whoever has more films currently showing", () => {
      // Preferring the director outright put Julie Pacino's one film above Al
      // Pacino's six.
      expect(
        resolve(
          "pacino",
          [p("d1", "Julie Pacino", 1)],
          [p("a1", "Al Pacino", 6)],
        ),
      ).toEqual(["Cast:Al Pacino", "Director:Julie Pacino"]);
    });

    it("breaks an equal count on popularity", () => {
      expect(
        resolve(
          "zombie",
          [p("d1", "Rob Zombie", 5, 80)],
          [p("a1", "Sheri Moon Zombie", 5, 30)],
        ),
      ).toEqual(["Director:Rob Zombie", "Cast:Sheri Moon Zombie"]);
      expect(
        resolve(
          "zombie",
          [p("d1", "Rob Zombie", 5, 10)],
          [p("a1", "Sheri Moon Zombie", 5, 90)],
        ),
      ).toEqual(["Cast:Sheri Moon Zombie", "Director:Rob Zombie"]);
    });

    it("ranks someone with a score above someone without one", () => {
      expect(
        resolve(
          "palma",
          [p("d1", "Brian De Palma", 2)],
          [p("a1", "Rossy de Palma", 2, 50)],
        ),
      ).toEqual(["Cast:Rossy de Palma", "Director:Brian De Palma"]);
    });

    // A release published before the pipeline emitted popularity has none.
    it("falls back to director-first when neither carries a score", () => {
      expect(
        resolve(
          "palma",
          [p("d1", "Brian De Palma", 2)],
          [p("a1", "Rossy de Palma", 2)],
        ),
      ).toEqual(["Director:Brian De Palma", "Cast:Rossy de Palma"]);
    });
  });

  describe("tier 3 — one person in two roles", () => {
    it("offers both roles, each answering for different films", () => {
      expect(
        resolve(
          "eastwood",
          [p("1", "Clint Eastwood", 2)],
          [p("1", "Clint Eastwood", 3)],
        ),
      ).toEqual(["Cast:Clint Eastwood", "Director:Clint Eastwood"]);
    });

    // TheMovieDB carries duplicate person records, so the same human can hold
    // two ids — and a reader cannot tell two identical names apart anyway.
    it("compares by name, not id", () => {
      expect(
        resolve(
          "john carpenter",
          [p("d1", "John Carpenter", 1)],
          [p("a1", "John Carpenter", 1)],
        ),
      ).toEqual(["Director:John Carpenter", "Cast:John Carpenter"]);
    });
  });

  describe("tier 4 — ambiguous everywhere", () => {
    it("names nobody when it names everybody", () => {
      expect(
        resolve(
          "john",
          [p("d1", "John Carpenter", 1), p("d2", "John Boorman", 1)],
          [p("a1", "John Cazale", 1), p("a2", "John Hurt", 1)],
        ),
      ).toEqual([]);
    });

    it("returns nothing for a fragment no name claims", () => {
      expect(resolve("kurosawa", [p("d1", "Agnès Varda", 1)])).toEqual([]);
    });
  });
});
