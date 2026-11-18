import { describe, it, expect } from "vitest";
import type { Movie, Venue } from "@clusterflick/catalogue/types";
import { getMovieSeoLead, getVenueTitleArea } from "./get-seo-copy";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

type TestVenue = Pick<Venue, "name" | "programming">;
const venues: Record<string, TestVenue> = {
  pcc: { name: "Prince Charles Cinema", programming: "cinema" },
  bfi: { name: "BFI Southbank", programming: "cinema" },
  rio: { name: "Rio Cinema", programming: "cinema" },
  ica: { name: "ICA", programming: "cinema" },
  pub: { name: "The Social", programming: "host" },
};

function makeMovie(performances: { day: number; venue: string }[]) {
  const showings = Object.fromEntries(
    performances.map(({ venue }) => [venue, { venueId: venue }]),
  );
  return {
    title: "Heat",
    showings,
    performances: performances.map(({ day, venue }) => ({
      showingId: venue,
      time: NOW + day * DAY,
    })),
  } as unknown as Pick<Movie, "title" | "showings" | "performances">;
}

describe("getMovieSeoLead", () => {
  it("counts the week's venues and names the busiest", () => {
    const movie = makeMovie([
      { day: 1, venue: "rio" },
      { day: 1, venue: "bfi" },
      { day: 2, venue: "bfi" },
      { day: 1, venue: "pcc" },
      { day: 2, venue: "pcc" },
      { day: 3, venue: "pcc" },
      { day: 4, venue: "ica" },
      // Outside the week and in the past, so not counted.
      { day: 9, venue: "pub" },
      { day: -1, venue: "pub" },
    ]);
    expect(getMovieSeoLead(movie, venues, NOW)).toBe(
      "Heat is showing at 4 London cinemas this week, including Prince Charles Cinema, BFI Southbank and ICA.",
    );
  });

  it("says venues once any of them isn't a cinema", () => {
    const movie = makeMovie([
      { day: 1, venue: "rio" },
      { day: 1, venue: "pub" },
      { day: 1, venue: "ica" },
      { day: 1, venue: "bfi" },
    ]);
    expect(getMovieSeoLead(movie, venues, NOW)).toMatch(
      /^Heat is showing at 4 London venues this week/,
    );
  });

  it("names every venue when there are three or fewer", () => {
    expect(
      getMovieSeoLead(
        makeMovie([
          { day: 1, venue: "rio" },
          { day: 2, venue: "ica" },
        ]),
        venues,
        NOW,
      ),
    ).toBe("Heat is showing at ICA and Rio Cinema this week.");
    expect(
      getMovieSeoLead(makeMovie([{ day: 1, venue: "rio" }]), venues, NOW),
    ).toBe("Heat is showing at Rio Cinema this week.");
  });

  it("names fewer venues rather than run long", () => {
    const long: Record<string, TestVenue> = Object.fromEntries(
      ["a", "b", "c", "d"].map((id) => [
        id,
        {
          name: `${id.toUpperCase()} ${"Long ".repeat(6)}Cinema`,
          programming: "cinema",
        },
      ]),
    );
    const lead = getMovieSeoLead(
      makeMovie(["a", "b", "c", "d"].map((venue) => ({ day: 1, venue }))),
      long,
      NOW,
    );
    expect(lead).toBe(
      "Heat is showing at 4 London cinemas this week, including A Long Long Long Long Long Long Cinema.",
    );
    expect(lead!.length).toBeLessThanOrEqual(120);
  });

  it("makes no claim when nothing is on in the week", () => {
    expect(
      getMovieSeoLead(makeMovie([{ day: 10, venue: "rio" }]), venues, NOW),
    ).toBeNull();
  });
});

describe("getVenueTitleArea", () => {
  it("adds the borough when the name doesn't say where it is", () => {
    expect(getVenueTitleArea("Rio Cinema", "Hackney")).toBe("Hackney");
    expect(getVenueTitleArea("Curzon Bloomsbury", "Camden")).toBe("Camden");
  });

  it("leaves it out when the name already does", () => {
    expect(getVenueTitleArea("Hackney Picturehouse", "Hackney")).toBeNull();
    expect(
      getVenueTitleArea("Chelsea Cinema", "Kensington and Chelsea"),
    ).toBeNull();
    expect(
      getVenueTitleArea("Odeon Richmond", "Richmond upon Thames"),
    ).toBeNull();
  });

  it("leaves it out for a venue outside the boroughs", () => {
    expect(getVenueTitleArea("Somewhere", null)).toBeNull();
  });
});
