import { describe, it, expect } from "vitest";
import { FESTIVALS } from "./festivals";
import { FilterId } from "@/lib/filters/types";
import {
  matchesSearchQuery,
  normalizeForSearch,
} from "@/lib/filters/normalize";

const GARDEN_NOTES: [note: string, festivalId: string][] = [
  [
    "Part of Doc'n Roll Film Festival 2026\nThe screening will be followed by a Q&A.",
    "docn-roll-film-festival",
  ],
  [
    "Part of Kino London Short Film Festival 2026\nThe screening will be followed by a discussion.",
    "kino-london-short-film-festival",
  ],
  [
    "Part of Fringe! Queer Film Festival 2026\nThe screening will be followed by a Q&A.",
    "fringe-queer-film-arts-fest",
  ],
  ["Part of Tibet Film Festival London 2026", "tibet-film-festival"],
  ["Part of London Latino Film Festival", "london-latino-film-festival"],
  [
    "Part of London Palestine Film Festival 2026",
    "london-palestine-film-festival",
  ],
  [
    "Part of London International Animation Festival 2026\nThe screening will be introduced.",
    "london-international-animation-festival",
  ],
];

// Notes from venues other than the Garden, worded as each venue words them
const OTHER_NOTES: [note: string, festivalId: string][] = [
  // BFI Southbank and the ICA
  ["Part of London Korean Film Festival 2026", "london-korean-film-festival"],
  ["Part of Film Africa 2026", "film-africa"],
  // Ciné Lumière's season tags
  [
    "UK premiere\nPart of London Korean Film Festival",
    "london-korean-film-festival",
  ],
  ["+ Q&A\nPart of Film Africa 2026", "film-africa"],
  ["Part of French Film Festival London", "french-film-festival-london"],
  ["Part of French Film Festival UK", "french-film-festival-uk"],
  [
    "Part of 200 Years of Photography\nPart of Fashion in Film Festival",
    "fashion-in-film-festival",
  ],
];

const matchesNote = (festivalId: string, note: string): boolean => {
  const festival = FESTIVALS.find(({ id }) => id === festivalId);
  if (!festival) throw new Error(`No festival registered as "${festivalId}"`);

  return festival.matchers.some((matcher) => {
    const query = matcher[FilterId.PerformanceNotesSearch];
    if (typeof query !== "string") return false;
    return matchesSearchQuery(note, normalizeForSearch(query));
  });
};

describe("festival performance-note matchers", () => {
  it.each([...GARDEN_NOTES, ...OTHER_NOTES])(
    "%s is claimed by %s",
    (note, festivalId) => {
      expect(matchesNote(festivalId, note)).toBe(true);
    },
  );

  it("does not let one festival claim another's note", () => {
    for (const [note, festivalId] of [...GARDEN_NOTES, ...OTHER_NOTES]) {
      const claimants = FESTIVALS.filter(({ id }) => matchesNote(id, note)).map(
        ({ id }) => id,
      );
      expect(claimants).toEqual([festivalId]);
    }
  });
});

describe("Phoenix Rising International Film Festival title matchers", () => {
  const festival = FESTIVALS.find(
    ({ id }) => id === "phoenix-rising-international-film-festival",
  )!;

  const claims = (title: string): boolean =>
    festival.matchers.some((matcher) => {
      const query = matcher[FilterId.ShowingTitleSearch];
      if (typeof query !== "string") return false;
      return matchesSearchQuery(title, normalizeForSearch(query));
    });

  it("claims the festival by its full name", () => {
    expect(claims("Phoenix Rising International Film Festival")).toBe(true);
  });

  it("claims the festival by its abbreviation", () => {
    expect(claims("PRIFF 2026: Shorts Programme 1")).toBe(true);
  });

  it("does not claim a film titled Phoenix Rising", () => {
    expect(claims("Phoenix Rising")).toBe(false);
  });
});

describe("Turn Up Film Festival title matchers", () => {
  const festival = FESTIVALS.find(({ id }) => id === "turn-up-film-festival")!;

  // Each matcher's title query, checked only where its venue scope allows
  const claims = (title: string, venueId: string): boolean =>
    festival.matchers.some((matcher) => {
      const query = matcher[FilterId.ShowingTitleSearch];
      if (typeof query !== "string") return false;
      const venues = matcher[FilterId.Venues];
      if (venues && !venues.includes(venueId)) return false;
      return matchesSearchQuery(title, normalizeForSearch(query));
    });

  it.each([
    "Turn Up Film Festival - Short Film Competition Part 1 + Q&A",
    "Turn Up Film Festival -Short Film Competition Part 4 + Q&A",
    "Line producing with Ioanna Karavela - Masterclass - TUFF 2027 (Room UG05)",
  ])("claims %s at Regent Street Cinema", (title) => {
    expect(claims(title, "regentstreetcinema.com")).toBe(true);
  });

  it.each([
    "Carl Sagan: We Are Made of Star Stuff",
    "Funky Stuff",
    "The Right Stuff",
  ])("does not claim %s", (title) => {
    expect(claims(title, "regentstreetcinema.com")).toBe(false);
  });
});

describe("London International Animation Festival title matchers", () => {
  const festival = FESTIVALS.find(
    ({ id }) => id === "london-international-animation-festival",
  )!;

  const claims = (title: string): boolean =>
    festival.matchers.some((matcher) => {
      const query = matcher[FilterId.ShowingTitleSearch];
      if (typeof query !== "string") return false;
      return matchesSearchQuery(title, normalizeForSearch(query));
    });

  it.each([
    "LIAF 2026: International Competition Programme 1- Abstract Showcase",
    "LIAF 2026: Jinsei- Animated Feature Film UK Premiere",
  ])("claims %s", (title) => {
    expect(claims(title)).toBe(true);
  });

  it("does not claim a title running the letters together", () => {
    expect(claims("Bali Africa")).toBe(false);
  });
});

describe("Women and the World International Film Festival title matchers", () => {
  const festival = FESTIVALS.find(
    ({ id }) => id === "women-and-the-world-film-festival",
  )!;

  const claims = (title: string): boolean =>
    festival.matchers.some((matcher) => {
      const query = matcher[FilterId.ShowingTitleSearch];
      if (typeof query !== "string") return false;
      return matchesSearchQuery(title, normalizeForSearch(query));
    });

  it.each([
    'WWIFF: Special screening "DOVZHENKO. THE FIRST LOOK"',
    "DocHouse: Women and the World Festival: Traces",
  ])("claims %s", (title) => {
    expect(claims(title)).toBe(true);
  });
});

describe("QUEERHUB Film Festival title matchers", () => {
  const festival = FESTIVALS.find(({ id }) => id === "queerhub")!;

  const claims = (title: string): boolean =>
    festival.matchers.some((matcher) => {
      const query = matcher[FilterId.ShowingTitleSearch];
      if (typeof query !== "string") return false;
      return matchesSearchQuery(title, normalizeForSearch(query));
    });

  it.each([
    "QUEERHUB Film Festival: Friday",
    "QUEERHUB Film Festival: Saturday",
  ])("claims %s", (title) => {
    expect(claims(title)).toBe(true);
  });
});

describe("SIFFA title matchers", () => {
  const festival = FESTIVALS.find(({ id }) => id === "siffa")!;

  const claims = (title: string): boolean =>
    festival.matchers.some((matcher) => {
      const query = matcher[FilterId.ShowingTitleSearch];
      if (typeof query !== "string") return false;
      return matchesSearchQuery(title, normalizeForSearch(query));
    });

  it.each([
    "SIFFA 2026 Opening Gala: Nicholas and Alexandra",
    "SIFFA 2026: Gipsy Kings + Q&A | In Competition",
  ])("claims %s", (title) => {
    expect(claims(title)).toBe(true);
  });
});

describe("Unrestricted View Horror Film Festival title matchers", () => {
  const festival = FESTIVALS.find(
    ({ id }) => id === "unrestricted-view-horror-film-festival",
  )!;

  const claims = (title: string): boolean =>
    festival.matchers.some((matcher) => {
      const query = matcher[FilterId.ShowingTitleSearch];
      if (typeof query !== "string") return false;
      return matchesSearchQuery(title, normalizeForSearch(query));
    });

  it.each([
    "Unrestricted View Horror Film Festival 2026: Opening Night",
    "UNRESTRICTED VIEW HORROR FILM FESTIVAL 2026 X BIFA: SAINT MAUD",
    "UVHFF x About Bloody Time",
  ])("claims %s", (title) => {
    expect(claims(title)).toBe(true);
  });

  it("does not claim the spring Unrestricted View Film Festival", () => {
    expect(claims("Unrestricted View Film Festival 2027: Opening Night")).toBe(
      false,
    );
  });
});

describe("French film festival title matchers", () => {
  const claimants = (title: string): string[] =>
    FESTIVALS.filter(({ matchers }) =>
      matchers.some((matcher) => {
        const query = matcher[FilterId.ShowingTitleSearch];
        if (typeof query !== "string") return false;
        return matchesSearchQuery(title, normalizeForSearch(query));
      }),
    ).map(({ id }) => id);

  it("files the Gate's French Film Fest UK screening under the UK festival only", () => {
    expect(claimants("French Film Fest UK: The Money Maker + Q&A")).toEqual([
      "french-film-festival-uk",
    ]);
  });

  it("files a French Film Festival London title under the London festival only", () => {
    expect(claimants("French Film Festival London: Opening Night")).toEqual([
      "french-film-festival-london",
    ]);
  });
});
