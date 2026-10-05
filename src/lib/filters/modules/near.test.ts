import { describe, it, expect } from "vitest";
import { Category, type Movie } from "@/types";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import { FilterId, type MoviesRecord } from "../types";
import {
  getDefaultState,
  getPermissiveState,
  set,
  apply,
  hasActiveFilters,
  getRestrictiveFilterIds,
  resolveFilterStateFromUrl,
  buildFilterUrl,
} from "../manager";
import { createNearValue } from "./near";

const IN_WINDOW = getLondonMidnightTimestamp() + 2 * MS_PER_DAY;

/** A film showing once at each of the given venues. */
function makeMovie(id: string, venueIds: string[]): Movie {
  return {
    id,
    title: id,
    normalizedTitle: id,
    showings: Object.fromEntries(
      venueIds.map((venueId) => [
        `${id}-${venueId}`,
        {
          id: `${id}-${venueId}`,
          category: Category.Movie,
          url: `https://example.com/${id}/${venueId}`,
          venueId,
        },
      ]),
    ),
    performances: venueIds.map((venueId) => ({
      bookingUrl: `https://example.com/book/${id}/${venueId}`,
      showingId: `${id}-${venueId}`,
      time: IN_WINDOW,
    })),
  } as Movie;
}

const MOVIES: MoviesRecord = {
  alien: makeMovie("alien", ["near-a", "far"]),
  heat: makeMovie("heat", ["far"]),
};

const KINGS_CROSS = createNearValue({
  kind: "station",
  slug: "kings-cross-st-pancras",
});

describe("nearFilter", () => {
  it("is off by default and when fully permissive", () => {
    expect(getDefaultState().near).toBeNull();
    expect(getPermissiveState().near).toBeNull();
  });

  it("keeps only showings at the resolved venues", () => {
    const state = set(getDefaultState(), FilterId.Near, {
      ...KINGS_CROSS,
      venues: ["near-a"],
    });
    const result = apply(MOVIES, state);
    expect(Object.keys(result)).toEqual(["alien"]);
    expect(Object.values(result.alien.showings).map((s) => s.venueId)).toEqual([
      "near-a",
    ]);
  });

  // Matching everything would claim the whole city is nearby.
  it("matches nothing until its venues are resolved", () => {
    const state = set(getDefaultState(), FilterId.Near, KINGS_CROSS);
    expect(apply(MOVIES, state)).toEqual({});
    expect(hasActiveFilters(state)).toBe(true);
    expect(getRestrictiveFilterIds(state)).toContain(FilterId.Near);
  });

  // "Cinemas near King's Cross": the venue pills and a place narrow together.
  it("combines with the venue filter as 'and'", () => {
    let state = set(getDefaultState(), FilterId.Near, {
      ...KINGS_CROSS,
      venues: ["near-a", "far"],
    });
    state = set(state, FilterId.Venues, ["far"]);
    expect(Object.keys(apply(MOVIES, state)).sort()).toEqual(["alien", "heat"]);
    state = set(state, FilterId.Venues, ["elsewhere"]);
    expect(apply(MOVIES, state)).toEqual({});
  });
});

describe("near in the URL", () => {
  it("carries the place and radius, never the resolved venues", () => {
    const state = set(getDefaultState(), FilterId.Near, {
      ...KINGS_CROSS,
      radiusMiles: 0.5,
      label: "King's Cross St. Pancras",
      venues: ["near-a"],
    });
    const url = new URL(buildFilterUrl(state), "https://example.com");
    expect(url.searchParams.get("near")).toBe("station:kings-cross-st-pancras");
    expect(url.searchParams.get("within")).toBe("0.5mi");
    expect(url.search).not.toContain("near-a");
  });

  it("reads back unresolved, for the sync to fill in", () => {
    const resolved = resolveFilterStateFromUrl(
      "?near=station:kings-cross-st-pancras&within=0.5mi",
      getDefaultState(),
    );
    expect(resolved?.near).toEqual({
      place: "station:kings-cross-st-pancras",
      radiusMiles: 0.5,
      label: null,
      venues: null,
    });
  });

  it("takes a radius in kilometres", () => {
    const resolved = resolveFilterStateFromUrl(
      "?near=here&within=2km",
      getDefaultState(),
    );
    expect(resolved?.near?.radiusMiles).toBeCloseTo(1.243, 3);
  });

  it("falls back to the default radius when none is given", () => {
    const resolved = resolveFilterStateFromUrl(
      "?near=venue:bfi.org.uk-southbank",
      getDefaultState(),
    );
    expect(resolved?.near?.radiusMiles).toBe(1);
  });

  it("ignores a place it can't read", () => {
    expect(
      resolveFilterStateFromUrl("?near=borough:camden", getDefaultState()),
    ).toBeNull();
  });

  // A patch link amends the session state; an empty `near=` is how it clears
  // a place without touching anything else.
  it("clears a place with an empty param", () => {
    const current = set(getDefaultState(), FilterId.Near, KINGS_CROSS);
    const resolved = resolveFilterStateFromUrl("?base=patch&near=", current);
    expect(resolved?.near).toBeNull();
  });
});
