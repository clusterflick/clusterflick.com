import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchCurrentRelease,
  fetchRelease,
  ListingsUnavailableError,
} from "./fetch-listings";

const ORIGIN = "https://clusterflick.com";
const META = "data.meta.abcdefabcd.json";
const CHUNK = "data.0.abcdefabcd.json";
const FAR = Date.UTC(2099, 0, 1);

/** The site's published files, by name under data/, each as JSON. */
function serve(files: Record<string, unknown>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const name = String(input).slice(`${ORIGIN}/data/`.length);
    return name in files
      ? Response.json(files[name])
      : new Response("", { status: 404 });
  });
}

const RELEASE = {
  "current.json": { formatVersion: 1, meta: META },
  [META]: {
    formatVersion: 1,
    generatedAt: "2026-11-16T06:00:00Z",
    filenames: [CHUNK],
    mapping: { "0": ["m1"] },
    genres: { "18": { name: "Drama" } },
    people: {},
    venues: { rio: { name: "Rio Cinema" } },
    collections: {},
  },
  [CHUNK]: {
    m1: {
      title: "Halloween",
      genres: ["18"],
      showings: { s1: { venueId: "rio" } },
      performances: [{ showingId: "s1", time: FAR }],
    },
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchCurrentRelease", () => {
  it("names the current meta file, asked of the site, never a cache", async () => {
    const fetch = serve(RELEASE);
    expect(await fetchCurrentRelease(ORIGIN)).toBe(META);
    expect(fetch).toHaveBeenCalledWith(`${ORIGIN}/data/current.json`, {
      cache: "no-store",
    });
  });

  it.each([
    ["another data format", { formatVersion: 2, meta: META }, "data format 2"],
    ["no meta file", { formatVersion: 1, meta: "../x.json" }, "no meta file"],
  ])("refuses %s", async (_, pointer, message) => {
    serve({ "current.json": pointer });
    const failure = fetchCurrentRelease(ORIGIN);
    await expect(failure).rejects.toThrow(ListingsUnavailableError);
    await expect(failure).rejects.toThrow(message);
  });

  it("is unavailable when the site doesn't answer", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    await expect(fetchCurrentRelease(ORIGIN)).rejects.toThrow(
      ListingsUnavailableError,
    );
  });
});

describe("fetchRelease", () => {
  it("reads the release as the site does", async () => {
    serve(RELEASE);
    const data = await fetchRelease(ORIGIN, META);
    expect(data.movies.m1.id).toBe("m1");
    expect(data.venues.rio.id).toBe("rio");
  });

  it("refuses a chunk name that isn't one", async () => {
    serve({ ...RELEASE, [META]: { ...RELEASE[META], filenames: ["../x"] } });
    await expect(fetchRelease(ORIGIN, META)).rejects.toThrow(
      "names a chunk that isn't one",
    );
  });

  it("is unavailable when a chunk is missing", async () => {
    const files: Record<string, unknown> = { ...RELEASE };
    delete files[CHUNK];
    serve(files);
    await expect(fetchRelease(ORIGIN, META)).rejects.toThrow(
      ListingsUnavailableError,
    );
  });
});
