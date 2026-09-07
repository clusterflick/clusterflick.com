import { describe, it, expect } from "vitest";
import { Category, type Movie } from "@/types";
import { FilterId } from "./types";
import { applyMatchers } from "./apply-matchers";

const DAY = 86_400_000;
const soon = () => Date.now() + DAY;

/**
 * Modelled on the live "Shall We Dance?" record: the Phoenix lists it under the
 * club's name and hands booking to the club, so its own listing is what we hold
 * and the club's copy is deduplicated away upstream — leaving the showing title
 * as the only thing tying it to the club. The sourced copies at the other two
 * venues carry the club's note instead.
 */
const shallWeDance: Movie = {
  id: "11239",
  title: "Shall We Dance?",
  normalizedTitle: "shall we dance",
  showings: {
    "phoenixcinema.co.uk-640697": {
      id: "phoenixcinema.co.uk-640697",
      title: "Japanese Film Club: Shall We Dance?",
      category: Category.Movie,
      url: "https://www.phoenixcinema.co.uk/PhoenixCinemaLondon.dll/WhatsOn?f=640697",
      venueId: "phoenixcinema.co.uk",
    },
    "japanesefilm.club-shall-we-dance-regentstreetcinema.com": {
      id: "japanesefilm.club-shall-we-dance-regentstreetcinema.com",
      title: "Shall We Dance? – 4K Restoration",
      category: Category.Movie,
      url: "https://japanesefilm.club/shall-we-dance/",
      venueId: "regentstreetcinema.com",
    },
  },
  performances: [
    {
      showingId: "phoenixcinema.co.uk-640697",
      bookingUrl: "https://japanesefilm.club/shall-we-dance/",
      time: soon(),
      notes: "",
    },
    {
      showingId: "japanesefilm.club-shall-we-dance-regentstreetcinema.com",
      bookingUrl: "https://japanesefilm.club/shall-we-dance-regent-street/",
      time: soon() + DAY,
      notes: "Presented by Japanese Film Club",
    },
  ],
};

const clubMatchers = [
  { [FilterId.ShowingTitleSearch]: "Japanese Film Club" },
  { [FilterId.PerformanceNotesSearch]: "Japanese Film Club" },
];

const venuesOf = (movie: Movie) =>
  Object.values(movie.showings)
    .map((showing) => showing.venueId)
    .sort();

describe("applyMatchers", () => {
  it("unions the showings a movie matches through different matchers", () => {
    const result = applyMatchers(clubMatchers, { "11239": shallWeDance });

    expect(venuesOf(result["11239"])).toEqual([
      "phoenixcinema.co.uk",
      "regentstreetcinema.com",
    ]);
    expect(result["11239"].performances).toHaveLength(2);
  });

  it("keeps the dataset's performance ordering", () => {
    const result = applyMatchers([...clubMatchers].reverse(), {
      "11239": shallWeDance,
    });

    expect(result["11239"].performances).toEqual(shallWeDance.performances);
  });

  it("keeps only what the matchers matched", () => {
    const alsoAtTheRio: Movie = {
      ...shallWeDance,
      showings: {
        ...shallWeDance.showings,
        "riocinema.org.uk-1": {
          id: "riocinema.org.uk-1",
          category: Category.Movie,
          url: "https://riocinema.org.uk/1",
          venueId: "riocinema.org.uk",
        },
      },
      performances: [
        ...shallWeDance.performances,
        {
          showingId: "riocinema.org.uk-1",
          bookingUrl: "https://riocinema.org.uk/book/1",
          time: soon() + 2 * DAY,
        },
      ],
    };

    const result = applyMatchers(clubMatchers, { "11239": alsoAtTheRio });

    expect(venuesOf(result["11239"])).toEqual([
      "phoenixcinema.co.uk",
      "regentstreetcinema.com",
    ]);
  });

  it("prunes finished performances", () => {
    const finished: Movie = {
      ...shallWeDance,
      performances: shallWeDance.performances.map((performance) => ({
        ...performance,
        time: Date.now() - DAY,
      })),
    };

    expect(applyMatchers(clubMatchers, { "11239": finished })).toEqual({});
  });

  it("returns nothing when no matcher matches", () => {
    expect(
      applyMatchers([{ [FilterId.ShowingTitleSearch]: "Korean Film Club" }], {
        "11239": shallWeDance,
      }),
    ).toEqual({});
  });
});
