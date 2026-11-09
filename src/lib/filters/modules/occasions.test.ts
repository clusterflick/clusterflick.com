import { describe, it, expect } from "vitest";
import {
  Category,
  OccasionType,
  OCCASION_NONE,
  type Movie,
  type MoviePerformanceOccasions,
} from "@/types";
import { FilterId } from "../types";
import { getDefaultState, set, apply } from "../manager";
import { occasionsFilter } from "./occasions";

const roundTrip = (state: ReturnType<typeof getDefaultState>) => {
  const params = new URLSearchParams();
  occasionsFilter.toUrlParams(state, params);
  return occasionsFilter.fromUrlParams(params);
};

function makeMovie(
  id: string,
  occasions: (MoviePerformanceOccasions | undefined)[],
): Movie {
  return {
    id,
    title: id,
    normalizedTitle: id,
    showings: {
      [id]: {
        id,
        category: Category.Movie,
        url: `https://example.com/${id}`,
        venueId: "venue",
      },
    },
    performances: occasions.map((value, index) => ({
      bookingUrl: `https://example.com/${id}/${index}`,
      showingId: id,
      time: Date.now() + (index + 1) * 86_400_000,
      ...(value ? { occasions: value } : {}),
    })),
  } as Movie;
}

const movies = {
  eel: makeMovie("eel", [{ intro: { guests: ["Benjamin Crais"] } }, undefined]),
  blue: makeMovie("blue", [{ qAndA: true, premiere: { region: "uk" } }]),
  plain: makeMovie("plain", [undefined, {}]),
};

const performancesOf = (state: ReturnType<typeof getDefaultState>) =>
  Object.fromEntries(
    Object.values(apply(movies, state)).map((movie) => [
      movie.id,
      movie.performances.length,
    ]),
  );

describe("occasionsFilter", () => {
  const base = { ...getDefaultState(), dateRange: { start: null, end: null } };

  it("keeps every performance when unset", () => {
    expect(performancesOf(base)).toEqual({ eel: 2, blue: 1, plain: 2 });
  });

  it("keeps the performances with any selected kind", () => {
    const state = set(base, FilterId.Occasions, [
      OccasionType.Intro,
      OccasionType.Premiere,
    ]);
    expect(performancesOf(state)).toEqual({ eel: 1, blue: 1 });
  });

  it("reads None as performances with no occasion", () => {
    const state = set(base, FilterId.Occasions, [OCCASION_NONE]);
    expect(performancesOf(state)).toEqual({ eel: 1, plain: 2 });
  });

  it("matches nothing with nothing selected", () => {
    expect(performancesOf(set(base, FilterId.Occasions, []))).toEqual({});
  });

  it("survives the address round trip", () => {
    for (const value of [
      null,
      [],
      [OccasionType.QAndA, OCCASION_NONE],
    ] as const) {
      const state = set(base, FilterId.Occasions, value && [...value]);
      expect(roundTrip(state)).toEqual(value && [...value]);
    }
  });

  it("drops an unknown kind from the address", () => {
    const params = new URLSearchParams("occasions=qAndA,karaoke");
    expect(occasionsFilter.fromUrlParams(params)).toEqual([OccasionType.QAndA]);
  });
});
