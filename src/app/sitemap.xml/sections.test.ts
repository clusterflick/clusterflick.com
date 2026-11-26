import { describe, it, expect, vi } from "vitest";
import type { CinemaData, Movie, Venue } from "@clusterflick/catalogue/types";

vi.mock("@/utils/get-static-data", () => ({
  getStaticData: async (): Promise<CinemaData> => ({
    filenames: [],
    generatedAt: "2026-10-20T00:00:00.000Z",
    venues: {
      "prince-charles": {
        id: "prince-charles",
        name: "Prince Charles Cinema",
        structure: "group",
        groupName: "Picturehouse",
        geo: { lat: 51.5113, lon: -0.1302 },
      } as unknown as Venue,
    },
    people: {},
    genres: {},
    collections: {},
    movies: {
      "100": { id: "100", title: "Heat", showings: {} } as unknown as Movie,
    },
  }),
}));

vi.mock("@/utils/get-collections-data", () => ({
  getCollectionsData: () => ({}),
}));

vi.mock("@/utils/get-updates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/get-updates")>()),
  readDiffBlobs: () => [],
}));

const { getSitemapSections, getSitemapSectionUrl, SITEMAP_SECTION_IDS } =
  await import("./sections");
const { buildSitemapIndex, buildUrlSet } = await import("./xml");

async function sitemap() {
  return Object.values(await getSitemapSections()).flat();
}

describe("sitemap", () => {
  it("lists every page at its trailing-slash address, which is its canonical", async () => {
    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls.filter((url) => !url.endsWith("/"))).toEqual([]);
    // robots.txt blocks every address with a query string.
    expect(urls.filter((url) => url.includes("?"))).toEqual([]);
    expect(urls).toContain("https://clusterflick.com/");
    expect(urls).toContain("https://clusterflick.com/movies/100/heat/");
    expect(urls).toContain(
      "https://clusterflick.com/venues/prince-charles-cinema/",
    );
    expect(urls).toContain(
      "https://clusterflick.com/london-cinemas/westminster/",
    );
    expect(urls).toContain(
      "https://clusterflick.com/cinema-groups/picturehouse/",
    );
    expect(urls).toContain(
      "https://clusterflick.com/accessibility/audio-description/",
    );
  });

  it("lists the indexable pages that have no data-driven route", async () => {
    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls).toContain("https://clusterflick.com/near-me/");
    expect(urls).toContain("https://clusterflick.com/datasets/status/");
    expect(urls).toContain("https://clusterflick.com/privacy/");
  });

  it("leaves out the profile shell and profiles, which are found by links", async () => {
    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls.filter((url) => /\/(profile-shell|u)\//.test(url))).toEqual([]);
  });

  it("never stamps a page with the build time", async () => {
    const entries = await sitemap();

    expect(
      entries.filter(
        ({ lastModified }) => lastModified === "2026-10-20T00:00:00.000Z",
      ),
    ).toEqual([]);
  });

  it("puts each page in its own section's sitemap", async () => {
    const sections = await getSitemapSections();
    const urls = (id: keyof typeof sections) => sections[id].map((e) => e.url);

    expect(urls("films")).toEqual([
      "https://clusterflick.com/movies/100/heat/",
    ]);
    expect(urls("venues")).toEqual([
      "https://clusterflick.com/venues/",
      "https://clusterflick.com/venues/prince-charles-cinema/",
    ]);
    expect(urls("boroughs")).toContain(
      "https://clusterflick.com/london-cinemas/westminster/",
    );
    expect(urls("film-clubs")[0]).toBe("https://clusterflick.com/film-clubs/");
    expect(urls("accessibility")[0]).toBe(
      "https://clusterflick.com/accessibility/",
    );
    expect(urls("pages")).toContain("https://clusterflick.com/");
  });

  it("lists every page once, and leaves no section empty", async () => {
    const sections = await getSitemapSections();
    const urls = Object.values(sections)
      .flat()
      .map(({ url }) => url);

    expect(Object.keys(sections).sort()).toEqual(
      [...SITEMAP_SECTION_IDS].sort(),
    );
    expect(new Set(urls).size).toBe(urls.length);
    for (const id of SITEMAP_SECTION_IDS) {
      expect(sections[id].length, id).toBeGreaterThan(0);
    }
  });
});

describe("sitemap xml", () => {
  it("indexes every section's sitemap", () => {
    const xml = buildSitemapIndex(
      SITEMAP_SECTION_IDS.map(getSitemapSectionUrl),
    );

    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain(
      "<loc>https://clusterflick.com/sitemaps/film-clubs.xml</loc>",
    );
    expect(xml.match(/<sitemap>/g)).toHaveLength(SITEMAP_SECTION_IDS.length);
    expect(xml).not.toContain("<lastmod>");
  });

  it("writes entries as Next's sitemap convention did, escaped", () => {
    const xml = buildUrlSet([
      {
        url: "https://clusterflick.com/reports/a&b/",
        lastModified: "2026-11-01",
        changeFrequency: "monthly",
        priority: 0.6,
      },
      { url: "https://clusterflick.com/bot/" },
    ]);

    expect(xml).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        "<url>",
        "<loc>https://clusterflick.com/reports/a&amp;b/</loc>",
        "<lastmod>2026-11-01</lastmod>",
        "<changefreq>monthly</changefreq>",
        "<priority>0.6</priority>",
        "</url>",
        "<url>",
        "<loc>https://clusterflick.com/bot/</loc>",
        "</url>",
        "</urlset>",
        "",
      ].join("\n"),
    );
  });
});
