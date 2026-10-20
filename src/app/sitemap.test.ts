import { describe, it, expect, vi } from "vitest";
import type { CinemaData, Movie, Venue } from "@/types";

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

const { default: sitemap } = await import("./sitemap");

describe("sitemap", () => {
  it("lists every page at its trailing-slash address, which is its canonical", async () => {
    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls.filter((url) => !url.endsWith("/"))).toEqual([]);
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
  });
});
