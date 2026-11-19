import { describe, expect, it } from "vitest";
import {
  boundedDistance,
  findLostUrls,
  FUZZY_MAX_DISTANCE,
  FUZZY_MIN_LENGTH,
  resolve,
  type MovieUrlMap,
} from "./movie-url-map";

// Cut down from the map built on 19 November 2026: the URLs in the tests are
// ones Search Console reported as 404s.
const MAP: MovieUrlMap = {
  version: 1,
  generatedAt: "2026-11-19T05:20:34Z",
  slugs: {
    "10542": "killer-condom",
    "1339713": "obsession",
    "1702782": "royal-ballet-and-opera-2026-27-swan-lake",
    "1892": "return-of-the-jedi",
    "4780": "obsession",
    "7340": "carrie",
    "133805": "carrie",
    "53e1cfa7": "the-live-ghost-tent-quarterly-meeting-september-2027",
    a1: "liaf-2026-best-of-the-next-2-15",
    a2: "liaf-2026-best-of-the-next-3-15",
    b1: "60-years-of-struggle-civil-rights-african-odysseys-at-the-bfi",
    "329919": "turandot",
    "432021": "turandot",
  },
  titleHashes: {
    "18e3297f": "1702782",
    c5c614db: "1892",
  },
  liveSlugs: {
    "60-years-of-struggle-civil-rights-african-odysseys-at-the-bfi": ["b1"],
    carrie: ["7340"],
    "liaf-2026-best-of-the-next-2-15": ["a1"],
    "liaf-2026-best-of-the-next-3-15": ["a2"],
    obsession: ["1339713"],
    "return-of-the-jedi": ["1892"],
    "royal-ballet-and-opera-2026-27-swan-lake": ["1702782"],
    "the-live-ghost-tent-quarterly-meeting-september-2027": ["53e1cfa7"],
    turandot: ["329919", "432021"],
  },
};

describe("a known id", () => {
  it("is sent to its page when the slug has changed (301)", () => {
    expect(resolve("/movies/10542/the-killer-condom/", MAP)).toEqual({
      outcome: "redirect",
      status: 301,
      location: "/movies/10542/killer-condom/",
      rule: "id",
    });
  });

  it.each([
    "/movies/10542",
    "/movies/10542/",
    "/movies/10542/killer-con",
    "/movies/10542/Killer-Condom/",
    "/movies/10542/killer-condom/extra/",
  ])("is sent to its page from %s", (path) => {
    expect(resolve(path, MAP)).toMatchObject({
      location: "/movies/10542/killer-condom/",
      status: 301,
    });
  });

  it("is sent to a departed page too, which is still a page", () => {
    expect(resolve("/movies/133805/carrie-1976/", MAP)).toMatchObject({
      location: "/movies/133805/carrie/",
      rule: "id",
    });
  });

  it("isn't sent to itself when its own page 404s", () => {
    expect(resolve("/movies/10542/killer-condom/", MAP)).toEqual({
      outcome: "not-found",
      reason: "canonical",
    });
  });
});

describe("the old id of a listing since matched", () => {
  it("is sent to the film it matched (301)", () => {
    expect(
      resolve("/movies/18e3297f/the-royal-ballet-swan-lake/", MAP),
    ).toEqual({
      outcome: "redirect",
      status: 301,
      location: "/movies/1702782/royal-ballet-and-opera-2026-27-swan-lake/",
      rule: "title-hash",
    });
  });

  it("is found whatever its slug says", () => {
    expect(resolve("/movies/c5c614db/anything/", MAP)).toMatchObject({
      location: "/movies/1892/return-of-the-jedi/",
      rule: "title-hash",
    });
  });
});

describe("an unknown id", () => {
  it("is sent to the one showing film under its slug (302)", () => {
    expect(resolve("/movies/3add0819/obsession/", MAP)).toEqual({
      outcome: "redirect",
      status: 302,
      location: "/movies/1339713/obsession/",
      rule: "slug",
    });
  });

  // Matched against showing films only: the departed Carrie doesn't make
  // the showing one ambiguous.
  it("ignores departed films with the same slug", () => {
    expect(resolve("/movies/deadbeef/carrie/", MAP)).toMatchObject({
      location: "/movies/7340/carrie/",
      rule: "slug",
    });
  });

  it("is a 404 when two showing films share its slug", () => {
    expect(resolve("/movies/5166f215/turandot/", MAP)).toEqual({
      outcome: "not-found",
      reason: "ambiguous",
    });
  });

  it("is sent on from a retitle within the threshold (302)", () => {
    expect(
      resolve(
        "/movies/0a0a0a0a/60-years-of-struggle-civil-rights-african-odysseys-at-bfi/",
        MAP,
      ),
    ).toEqual({
      outcome: "redirect",
      status: 302,
      location:
        "/movies/b1/60-years-of-struggle-civil-rights-african-odysseys-at-the-bfi/",
      rule: "fuzzy-slug",
    });
  });

  it("is sent on to the next edition of a finished event", () => {
    expect(
      resolve(
        "/movies/a9ac80f0/the-live-ghost-tent-quarterly-meeting-september-2026/",
        MAP,
      ),
    ).toMatchObject({
      location: expect.stringContaining("53e1cfa7"),
      status: 302,
    });
  });

  it("is a 404 when the close titles are more than one film", () => {
    expect(
      resolve("/movies/0b0b0b0b/liaf-2026-best-of-the-next-1-15/", MAP),
    ).toEqual({ outcome: "not-found", reason: "ambiguous" });
  });

  it("must match exactly when short", () => {
    expect("carriers".length).toBeLessThan(FUZZY_MIN_LENGTH);
    expect(resolve("/movies/0c0c0c0c/carriers/", MAP)).toEqual({
      outcome: "not-found",
      reason: "no-match",
    });
  });

  it("is a 404 when nothing showing is close", () => {
    expect(resolve("/movies/de4fb93c/bbc-proms-bond-and-beyond/", MAP)).toEqual(
      { outcome: "not-found", reason: "no-match" },
    );
    expect(resolve("/movies/de4fb93c/", MAP)).toEqual({
      outcome: "not-found",
      reason: "no-match",
    });
  });
});

describe("what isn't a page", () => {
  it.each([
    "/movies/10542/the-killer-condom/index.txt",
    "/movies/10542/the-killer-condom/__next.movies.$d$id.txt",
    "/movies/",
    "/movies",
  ])("is left alone: %s", (path) => {
    expect(resolve(path, MAP)).toEqual({
      outcome: "not-found",
      reason: "not-a-page",
    });
  });
});

describe("a map that contradicts itself", () => {
  it("throws rather than inventing a page", () => {
    const broken = { ...MAP, titleHashes: { ffffffff: "999" } };
    expect(() => resolve("/movies/ffffffff/x/", broken)).toThrow(/no page/);
  });
});

describe("boundedDistance", () => {
  it("counts edits within the bound", () => {
    expect(boundedDistance("at-bfi", "at-the-bfi", 4)).toBe(4);
    expect(boundedDistance("kitten", "sitting", 3)).toBe(3);
  });

  it("gives up past the bound", () => {
    expect(boundedDistance("kitten", "sitting", 2)).toBe(Infinity);
    expect(boundedDistance("a", "abcdef", 3)).toBe(Infinity);
  });

  it("keeps the 10% threshold the Worker's README documents", () => {
    expect(FUZZY_MAX_DISTANCE).toBe(0.1);
  });
});

describe("findLostUrls", () => {
  const map = (
    slugs: Record<string, string>,
    rest: Partial<MovieUrlMap> = {},
  ): MovieUrlMap => ({
    version: 1,
    generatedAt: "2026-11-19T05:20:34Z",
    slugs,
    titleHashes: {},
    liveSlugs: {},
    departed: [],
    unmatched: [],
    ...rest,
  });

  it("leaves out every page still at its address", () => {
    const before = map({ "949": "heat", "7340": "carrie" });
    expect(findLostUrls(before, before)).toEqual([]);
  });

  it("says a film under a new slug was retitled, and redirects it", () => {
    const lost = findLostUrls(
      map({ "10542": "the-killer-condom" }),
      map({ "10542": "killer-condom" }),
    );
    expect(lost).toEqual([
      {
        path: "/movies/10542/the-killer-condom/",
        id: "10542",
        kind: "retitled",
        decision: {
          outcome: "redirect",
          status: 301,
          location: "/movies/10542/killer-condom/",
          rule: "id",
        },
      },
    ]);
  });

  it("says a finished unmatched listing is a listing, with nowhere to go", () => {
    const lost = findLostUrls(
      map(
        { de4fb93c: "bbc-proms-bond-and-beyond" },
        { unmatched: ["de4fb93c"] },
      ),
      map({}),
    );
    expect(lost).toMatchObject([
      {
        kind: "listing",
        decision: { outcome: "not-found", reason: "no-match" },
      },
    ]);
  });

  it("finds where a listing that was matched went", () => {
    const lost = findLostUrls(
      map({ "3add0819": "obsession" }, { unmatched: ["3add0819"] }),
      map(
        { "1339713": "obsession" },
        {
          titleHashes: { "3add0819": "1339713" },
          liveSlugs: { obsession: ["1339713"] },
        },
      ),
    );
    expect(lost).toMatchObject([
      {
        kind: "listing",
        decision: {
          location: "/movies/1339713/obsession/",
          rule: "title-hash",
        },
      },
    ]);
  });

  it("says a departed page that went was pruned", () => {
    const lost = findLostUrls(
      map(
        { "83053": "royal-opera-house-alices-adventures-in-wonderland" },
        {
          departed: ["83053"],
        },
      ),
      map({}),
    );
    expect(lost).toMatchObject([{ kind: "pruned" }]);
  });

  // Every matched film that stops showing should become a departed page.
  it("says a showing film that left without a page was lost", () => {
    const lost = findLostUrls(map({ "1892": "return-of-the-jedi" }), map({}));
    expect(lost).toMatchObject([{ kind: "lost", id: "1892" }]);
  });

  it("can't say why a film went when the earlier map predates the lists", () => {
    const before: MovieUrlMap = map({ "1892": "return-of-the-jedi" });
    delete before.departed;
    delete before.unmatched;
    expect(findLostUrls(before, map({}))).toMatchObject([{ kind: "unknown" }]);
  });
});
