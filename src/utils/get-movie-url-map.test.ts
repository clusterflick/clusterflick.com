import { describe, it, expect } from "vitest";
import type { Showing } from "@clusterflick/catalogue/types";
import {
  MOVIE_URL_MAP_VERSION,
  getListingId,
  getMovieUrlMap,
} from "./get-movie-url-map";

const showing = (title?: string): Showing => ({
  id: "s",
  title,
  category: "movie" as Showing["category"],
  url: "https://example.com",
  venueId: "v",
});

const film = (
  id: string,
  title: string,
  venueTitles: (string | undefined)[] = [],
  alternativeTitles?: string[],
) => ({
  id,
  title,
  alternativeTitles,
  showings: Object.fromEntries(
    venueTitles.map((venueTitle, i) => [`${id}-${i}`, showing(venueTitle)]),
  ),
});

const build = (
  live: ReturnType<typeof film>[],
  departed: { id: string; title: string }[] = [],
) =>
  getMovieUrlMap({
    live: Object.fromEntries(live.map((movie) => [movie.id, movie])),
    departed: Object.fromEntries(departed.map((movie) => [movie.id, movie])),
    generatedAt: "2026-11-19T05:20:34Z",
  });

describe("getListingId", () => {
  // Unmatched listings from a live release, keyed by the pipeline's getId.
  // If these stop agreeing, the Worker can no longer find a matched listing's
  // old address.
  it.each([
    ["Shen Yun", "2d0ca337"],
    ["Short Film Night in Hackney", "0bd17bb8"],
    ["Short Film Open Screen", "393506f7"],
  ])("gives %s the id the pipeline gave it", (title, id) => {
    expect(getListingId(title)).toBe(id);
  });
});

describe("getMovieUrlMap", () => {
  it("is versioned and dated", () => {
    const map = build([]);
    expect(map.version).toBe(MOVIE_URL_MAP_VERSION);
    expect(map.generatedAt).toBe("2026-11-19T05:20:34Z");
  });

  it("gives the slug of every page, showing or departed", () => {
    const map = build(
      [film("949", "Heat")],
      [{ id: "10542", title: "Killer Condom" }],
    );
    expect(map.slugs).toEqual({ "949": "heat", "10542": "killer-condom" });
  });

  it("maps the old id of a venue's listing to the film it now matches", () => {
    const map = build([film("1339713", "Obsession", ["Obsession (35mm)"])]);
    expect(map.titleHashes).toEqual({
      [getListingId("Obsession")]: "1339713",
      [getListingId("Obsession (35mm)")]: "1339713",
    });
  });

  it("leaves out an unmatched film's own id, whose page is live", () => {
    const id = getListingId("Short Film Open Screen");
    const map = build([film(id, "Short Film Open Screen")]);
    expect(map.titleHashes).toEqual({});
  });

  it("leaves out a venue title two films carry", () => {
    const map = build([
      film("329919", "Turandot"),
      film("432021", "Turandot"),
      film("1702782", "Royal Ballet & Opera 2026/27: Swan Lake", [
        "The Royal Ballet: Swan Lake",
      ]),
    ]);
    expect(map.titleHashes).not.toHaveProperty(getListingId("Turandot"));
    expect(map.titleHashes[getListingId("The Royal Ballet: Swan Lake")]).toBe(
      "1702782",
    );
  });

  it("lists every slug a showing film is found under, with its films", () => {
    const map = build([
      film("269149", "Zootopia", ["Zootropolis (2016)"], ["Zootropolis"]),
      film("329919", "Turandot"),
      film("432021", "Turandot"),
    ]);
    expect(map.liveSlugs).toEqual({
      turandot: ["329919", "432021"],
      zootopia: ["269149"],
      zootropolis: ["269149"],
      "zootropolis-2016": ["269149"],
    });
  });

  it("leaves departed films out of what a lost URL can be matched to", () => {
    const map = build(
      [film("7340", "Carrie")],
      [{ id: "133805", title: "Carrie" }],
    );
    expect(map.liveSlugs).toEqual({ carrie: ["7340"] });
    expect(Object.values(map.titleHashes)).toEqual(["7340"]);
  });
});
