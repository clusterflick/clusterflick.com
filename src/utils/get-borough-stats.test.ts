import { describe, it, expect } from "vitest";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import boundaries from "@/data/london-borough-boundaries.json";
import {
  FILM_BAND_LABELS,
  describeBoroughWeek,
  getFilmBand,
  type BoroughStats,
} from "./get-borough-stats";

const lewisham = LONDON_BOROUGHS.find((b) => b.slug === "lewisham")!;

function stats(venueCount: number, films: number, venues: number) {
  return {
    borough: lewisham,
    venueCount,
    week: {
      films,
      screenings: films,
      venues,
      venuesTracked: venueCount,
      thirtyFiveMm: { screenings: 0, films: 0 },
    },
  } satisfies BoroughStats;
}

describe("getFilmBand", () => {
  it("keeps the two non-quantities apart from the scale", () => {
    expect(getFilmBand(stats(0, 0, 0))).toBe("no-venues");
    expect(getFilmBand(stats(16, 0, 0))).toBe("nothing-on");
  });

  it("bands by films, each floor inclusive", () => {
    expect(
      [1, 9, 10, 29, 30, 50, 99, 100, 400].map((films) =>
        getFilmBand(stats(5, films, 1)),
      ),
    ).toEqual([0, 0, 1, 1, 2, 3, 3, 4, 4]);
  });

  it("labels every band", () => {
    expect(FILM_BAND_LABELS).toEqual([
      "Under 10",
      "10–29",
      "30–49",
      "50–99",
      "100+",
    ]);
  });
});

describe("describeBoroughWeek", () => {
  it("says how many of the borough's venues had anything on", () => {
    expect(describeBoroughWeek(stats(16, 4, 3))).toBe(
      "4 films across 4 screenings, at 3 of its 16 venues",
    );
    expect(describeBoroughWeek(stats(2, 1, 2))).toBe(
      "1 film across 1 screening, at both its venues",
    );
    expect(describeBoroughWeek(stats(5, 8, 5))).toBe(
      "8 films across 8 screenings, at all 5 venues",
    );
    expect(describeBoroughWeek(stats(1, 20, 1))).toBe(
      "20 films across 20 screenings, at its only venue",
    );
  });

  it("names a week with nothing on, and a borough with no venues", () => {
    expect(describeBoroughWeek(stats(16, 0, 0))).toBe(
      "Nothing on at its 16 venues",
    );
    expect(describeBoroughWeek(stats(0, 0, 0))).toBe("No venues listed");
  });
});

describe("london-borough-boundaries.json", () => {
  it("has an outline for exactly the boroughs in LONDON_BOROUGHS", () => {
    expect(Object.keys(boundaries.boroughs).sort()).toEqual(
      LONDON_BOROUGHS.map((b) => b.slug).sort(),
    );
  });
});
