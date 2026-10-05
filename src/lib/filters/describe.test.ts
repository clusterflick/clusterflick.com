import { describe, it, expect } from "vitest";
import { Category } from "@/types";
import { FilterId } from "./types";
import {
  getDefaultState,
  getPermissiveState,
  set,
  widenFilters,
} from "./manager";
import { describeFilterChips, describeFilters, formatList } from "./describe";

const CATEGORIES = [
  { value: Category.Movie, label: "Films" },
  { value: Category.Quiz, label: "Quizzes" },
];
const GENRES = {
  "27": { id: "27", name: "Horror" },
  "35": { id: "35", name: "Comedy" },
};
const PEOPLE = {
  d1: { id: "d1", name: "Ridley Scott" },
  d2: { id: "d2", name: "George Lucas" },
  a1: { id: "a1", name: "Mark Hamill" },
  a2: { id: "a2", name: "Harrison Ford" },
};

const MOVIES = {
  m1: { title: "Alien" },
  m2: { title: "Heat" },
  m3: { title: "Paris, Texas" },
};

const events = (state = getDefaultState()) =>
  describeFilters({
    state,
    categories: CATEGORIES,
    venues: null,
    genres: GENRES,
    people: PEOPLE,
    movies: MOVIES,
    cinemaVenueIds: [],
  }).events;

describe("formatList", () => {
  it("joins with the conjunction it is given", () => {
    expect(formatList(["A", "B"], 3)).toBe("A & B");
    expect(formatList(["A", "B"], 3, "", "or")).toBe("A or B");
    expect(formatList(["A", "B", "C"], 3, "", "or")).toBe("A, B or C");
  });

  it("uses it in the truncated form too, so the logic never flips mid-list", () => {
    expect(formatList(["A", "B", "C", "D"], 2, "", "or")).toBe("A or 3 more");
  });
});

// Every multi-select filter matches a film satisfying *any* selected value, so
// "&" would state the opposite of what the filter does.
describe("describeFilters reads multi-select filters as or", () => {
  it("joins directors and cast with or, and the two groups with and", () => {
    let state = set(getDefaultState(), FilterId.Directors, ["d1", "d2"]);
    state = set(state, FilterId.Cast, ["a1", "a2"]);
    expect(events(state)).toContain(
      "directed by Ridley Scott or George Lucas and starring Mark Hamill or Harrison Ford",
    );
  });

  it("joins genres with or", () => {
    const state = set(getDefaultState(), FilterId.Genres, ["27", "35"]);
    expect(events(state)).toContain("Horror or Comedy Genre");
  });

  it("joins event types with or", () => {
    const state = set(getDefaultState(), FilterId.Categories, [
      Category.Movie,
      Category.Quiz,
    ]);
    expect(events(state)).toContain("Films or Quizzes");
  });

  // Hiding finished showings is the default, so only turning it off is said.
  it("mentions finished showings only when they are included", () => {
    const dates = (state: ReturnType<typeof getDefaultState>) =>
      describeFilters({
        state,
        categories: CATEGORIES,
        venues: null,
        genres: GENRES,
        people: PEOPLE,
        cinemaVenueIds: [],
      }).dates;

    expect(dates(getDefaultState())).not.toContain("finished");
    const included = set(getDefaultState(), FilterId.HideFinished, false);
    expect(dates(included)).toContain(", including finished");
    const both = set(included, FilterId.HideSoldOut, true);
    expect(dates(both)).toContain("and not sold out, including finished");
  });
});

describe("describeFilters describes the films filter", () => {
  it("names up to two films", () => {
    const state = set(getDefaultState(), FilterId.Movies, ["m1", "m2"]);
    expect(events(state)).toContain('for "Alien" or "Heat"');
  });

  it("counts a longer selection", () => {
    const state = set(getDefaultState(), FilterId.Movies, ["m1", "m2", "m3"]);
    expect(events(state)).toContain("from 3 selected films");
  });

  // A watchlist link carries films that have finished their run. Counting them
  // would promise more than the grid can show.
  it("counts only the films the dataset holds", () => {
    const state = set(getDefaultState(), FilterId.Movies, [
      "m1",
      "m2",
      "m3",
      "gone",
    ]);
    expect(events(state)).toContain("from 3 selected films");
    const one = set(getDefaultState(), FilterId.Movies, ["m1", "gone"]);
    expect(events(one)).toContain('for "Alien"');
  });

  it("says so when none of the selection is showing", () => {
    const state = set(getDefaultState(), FilterId.Movies, ["gone"]);
    expect(events(state)).toContain("from films not currently showing");
  });

  it("stays quiet without a lookup, as the people filters do", () => {
    const state = set(getDefaultState(), FilterId.Movies, ["m1"]);
    const description = describeFilters({
      state,
      categories: CATEGORIES,
      venues: null,
      genres: GENRES,
      people: PEOPLE,
      cinemaVenueIds: [],
    }).events;
    expect(description).not.toContain("Alien");
  });
});

describe("describeFilters describes the film club and festival filters", () => {
  it("names the club, from the registry", () => {
    const state = set(getDefaultState(), FilterId.FilmClubs, ["cinebug"]);
    expect(events(state)).toBe("Films from Cinebug");
  });

  it("reads 'or' within a filter and 'and' across the two", () => {
    let state = set(getDefaultState(), FilterId.Categories, null);
    state = set(state, FilterId.FilmClubs, ["cinebug", "japanese-film-club"]);
    state = set(state, FilterId.Festivals, ["bfi-flare"]);
    expect(events(state)).toBe(
      "Events from Cinebug or Japanese Film Club and at BFI Flare: London LGBTQIA+ Film Festival",
    );
  });

  it("leaves out ids the registry no longer holds", () => {
    const state = set(getDefaultState(), FilterId.Festivals, [
      "gone",
      "bfi-flare",
    ]);
    expect(events(state)).toContain(
      "at BFI Flare: London LGBTQIA+ Film Festival",
    );
    const none = set(getDefaultState(), FilterId.Festivals, ["gone"]);
    expect(events(none)).toContain("at festivals no longer listed");
  });
});

describe("describeFilters describes the rating filters", () => {
  it("names the minimum and its source", () => {
    const state = set(getDefaultState(), FilterId.LetterboxdRating, 4);
    expect(events(state)).toBe("Films rated 4.0+ on Letterboxd");
  });

  it("names each source on its own scale", () => {
    let state = set(getDefaultState(), FilterId.ImdbRating, 8);
    state = set(state, FilterId.RottenTomatoesRating, 95);
    expect(events(state)).toBe(
      "Films rated 8.0+ on IMDb and 95%+ on Rotten Tomatoes",
    );
  });
});

const chips = (state = getDefaultState()) =>
  describeFilterChips({
    state,
    categories: CATEGORIES,
    venues: null,
    genres: GENRES,
    people: PEOPLE,
    movies: MOVIES,
    cinemaVenueIds: [],
  });

describe("describeFilterChips", () => {
  it("lists the restrictive defaults, marked as defaults", () => {
    expect(chips()).toEqual([
      {
        key: "dateRange",
        filterIds: [FilterId.DateRange],
        label: "Next 7 Days",
        isDefault: true,
      },
      {
        key: "categories",
        filterIds: [FilterId.Categories],
        label: "Films",
        isDefault: true,
      },
    ]);
  });

  it("lists nothing once every filter is permissive", () => {
    expect(chips(getPermissiveState())).toEqual([]);
  });

  it("leaves out hiding finished showings, which is on in every visit", () => {
    const state = set(getPermissiveState(), FilterId.HideFinished, true);
    expect(chips(state)).toEqual([]);
  });

  it("names what the reader set, not as defaults", () => {
    let state = set(getPermissiveState(), FilterId.Directors, ["d1"]);
    state = set(state, FilterId.LetterboxdRating, 4);
    state = set(state, FilterId.Genres, ["27", "35"]);
    state = set(state, FilterId.Search, " alien ");
    expect(
      chips(state).map(({ label, isDefault }) => ({ label, isDefault })),
    ).toEqual([
      { label: 'Title "alien"', isDefault: false },
      { label: "Directed by Ridley Scott", isDefault: false },
      { label: "Letterboxd 4.0+", isDefault: false },
      { label: "Horror or Comedy", isDefault: false },
    ]);
  });

  it("folds the three format groups into one chip covering only those set", () => {
    let state = set(getPermissiveState(), FilterId.FormatSource, [
      "35mm",
      "70mm",
    ]);
    state = set(state, FilterId.FormatDimension, ["3d"]);
    const [formats] = chips(state);
    expect(formats.key).toBe("formats");
    expect(formats.filterIds).toEqual([
      FilterId.FormatSource,
      FilterId.FormatDimension,
    ]);
  });

  it("still lists a filter whose names haven't loaded, under its own name", () => {
    const state = set(getPermissiveState(), FilterId.Cast, ["unknown"]);
    expect(chips(state).map((chip) => chip.label)).toEqual(["Cast"]);
  });

  it("names a film selection only from the films the dataset holds", () => {
    const two = set(getPermissiveState(), FilterId.Movies, ["m1", "gone"]);
    expect(chips(two).map((chip) => chip.label)).toEqual(['"Alien"']);
    const none = set(getPermissiveState(), FilterId.Movies, ["gone"]);
    expect(chips(none).map((chip) => chip.label)).toEqual([
      "Films not currently showing",
    ]);
  });

  it("is cleared by widening the filters a chip names", () => {
    const state = set(getDefaultState(), FilterId.Genres, ["27"]);
    const genre = chips(state).find((chip) => chip.key === "genres")!;
    expect(
      chips(widenFilters(state, genre.filterIds)).map((chip) => chip.key),
    ).toEqual(["dateRange", "categories"]);
  });
});

describe("describeFilters describes a place", () => {
  const near = {
    place: "station:kings-cross-st-pancras",
    radiusMiles: 1,
    label: "King's Cross St. Pancras",
    venues: ["v1"],
  };
  const describeState = (state = getDefaultState()) =>
    describeFilters({
      state,
      categories: CATEGORIES,
      venues: null,
      genres: GENRES,
      cinemaVenueIds: ["v1", "v2"],
    });

  it("stands in for the venues on its own", () => {
    const state = set(getDefaultState(), FilterId.Near, near);
    expect(describeState(state).venues).toBe(
      "Within 1 mile of King's Cross St. Pancras",
    );
  });

  // The venue pills and a place narrow together: "cinemas near King's Cross".
  it("narrows a venue selection", () => {
    let state = set(getDefaultState(), FilterId.Near, near);
    state = set(state, FilterId.Venues, ["v1", "v2"]);
    expect(describeState(state).venues).toBe(
      "At Cinemas within 1 mile of King's Cross St. Pancras",
    );
  });

  // The label arrives once the place resolves; until then it's read off the
  // place, so the trigger never says "near null".
  it("names an unresolved place from the place itself", () => {
    const state = set(getDefaultState(), FilterId.Near, {
      ...near,
      radiusMiles: 0.5,
      label: null,
      venues: null,
    });
    expect(describeState(state).venues).toBe(
      "Within half a mile of Kings Cross St Pancras",
    );
    const here = set(getDefaultState(), FilterId.Near, {
      place: "here",
      radiusMiles: 2,
      label: null,
      venues: null,
    });
    expect(describeState(here).venues).toBe("Within 2 miles of you");
  });

  it("is a chip of its own that widens to anywhere", () => {
    const state = set(getDefaultState(), FilterId.Near, near);
    const chips = describeFilterChips({
      state,
      categories: CATEGORIES,
      venues: null,
      genres: GENRES,
      cinemaVenueIds: [],
    });
    const chip = chips.find((c) => c.key === "near");
    expect(chip).toMatchObject({
      filterIds: [FilterId.Near],
      label: "Within 1 mile of King's Cross St. Pancras",
      isDefault: false,
    });
    expect(widenFilters(state, chip!.filterIds).near).toBeNull();
  });
});
