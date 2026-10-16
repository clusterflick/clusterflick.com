import { describe, expect, it } from "vitest";
import { AccessibilityFeature, Category, FormatSource } from "@/types";
import { FilterId, type FilterState } from "./types";
import {
  buildFilterParams,
  get,
  getBrowseAllState,
  getDefaultState,
  getPermissiveState,
  replaceFilterParams,
  resolveFilterStateFromUrl,
  statesEqual,
} from "./manager";

describe("base=all", () => {
  it("opens every category and date but keeps past showings hidden", () => {
    const state = resolveFilterStateFromUrl("?base=all", getDefaultState())!;
    expect(get(state, FilterId.Categories)).toBeNull();
    expect(get(state, FilterId.DateRange)).toEqual({ start: null, end: null });
    expect(get(state, FilterId.HideFinished)).toBe(true);
  });

  // The permissive state is the widest a search can be widened to, so it has
  // to include finished showings; a link a reader follows to browse must not.
  it("differs from the permissive state only in finished showings", () => {
    expect(get(getPermissiveState(), FilterId.HideFinished)).toBe(false);
    expect({
      ...getBrowseAllState(),
      [FilterId.HideFinished]: false,
    }).toEqual(getPermissiveState());
  });
});

// The catalogue and planner keep their filters in the address, so Back lands
// on the filters each history entry was showing. That only works if a state
// written to the URL reads back as the same state.
describe("filter params round trip", () => {
  const roundTrip = (state: FilterState) =>
    resolveFilterStateFromUrl(
      `?${buildFilterParams(state).toString()}`,
      getDefaultState(),
    ) ?? getDefaultState();

  const day = getDefaultState()[FilterId.DateRange].start!;
  const cases: [string, FilterState][] = [
    ["the default state", getDefaultState()],
    ["the permissive state", getPermissiveState()],
    ["base=all", getBrowseAllState()],
    [
      "a search across every kind of filter",
      {
        ...getDefaultState(),
        [FilterId.Search]: "alien",
        [FilterId.ShowingTitleSearch]: "double bill",
        [FilterId.PerformanceNotesSearch]: "q&a",
        [FilterId.Categories]: [Category.Movie, Category.Quiz],
        [FilterId.Venues]: ["venue-a", "venue-b"],
        [FilterId.DateRange]: { start: day, end: day },
        [FilterId.TimeRange]: { start: 1020, end: 1260 },
        [FilterId.Genres]: ["27", "878"],
        [FilterId.LetterboxdRating]: 4,
        [FilterId.ImdbRating]: 8,
        [FilterId.RottenTomatoesRating]: 95,
        [FilterId.Directors]: ["1"],
        [FilterId.Cast]: ["2", "3"],
        [FilterId.Movies]: ["123"],
        [FilterId.FilmClubs]: ["club"],
        [FilterId.Festivals]: ["festival"],
        [FilterId.Accessibility]: [AccessibilityFeature.Subtitled],
        [FilterId.FormatSource]: [FormatSource.ThirtyFiveMm],
        [FilterId.HideFinished]: false,
        [FilterId.HideSoldOut]: true,
      },
    ],
    [
      "filters selecting nothing",
      {
        ...getDefaultState(),
        [FilterId.Categories]: [],
        [FilterId.Venues]: [],
        [FilterId.Genres]: [],
        [FilterId.Accessibility]: [],
      },
    ],
  ];

  it.each(cases)("reads back %s unchanged", (_, state) => {
    expect(statesEqual(roundTrip(state), state)).toBe(true);
  });
});

describe("replaceFilterParams", () => {
  it("rewrites the filter params and keeps a page's own", () => {
    const state = { ...getDefaultState(), [FilterId.Cast]: ["2"] };
    const query = replaceFilterParams(
      "?base=all&venues=a&day=2026-10-16&view=time",
      state,
    );
    const params = new URLSearchParams(query);
    expect(params.get("cast")).toBe("2");
    expect(params.get("day")).toBe("2026-10-16");
    expect(params.get("view")).toBe("time");
    expect(params.has("base")).toBe(false);
    expect(params.has("venues")).toBe(false);
  });

  it("leaves nothing for the default state", () => {
    expect(replaceFilterParams("?imdb=8.0", getDefaultState())).toBe("");
  });
});
