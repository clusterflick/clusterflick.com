import { describe, it, expect } from "vitest";
import {
  formatPlaceRef,
  formatRadius,
  formatRadiusLabel,
  getPlaceFallbackLabel,
  getVenueIdsWithin,
  isPlaceResolvable,
  loadStations,
  parsePlaceRef,
  parseRadius,
  resolvePlace,
  MAX_RADIUS_MILES,
  MIN_RADIUS_MILES,
  type PlaceContext,
} from "./index";

const KINGS_CROSS = { lat: 51.53066, lon: -0.12319 };

const VENUES = {
  // ~0.3 miles from King's Cross
  "everyman.co.uk-kings-cross": {
    id: "everyman.co.uk-kings-cross",
    name: "Everyman King's Cross",
    geo: { lat: 51.5352, lon: -0.1249 },
  },
  // ~1.6 miles
  "bfi.org.uk-southbank": {
    id: "bfi.org.uk-southbank",
    name: "BFI Southbank",
    geo: { lat: 51.5069, lon: -0.1153 },
  },
  // ~8 miles
  "kingston.example": {
    id: "kingston.example",
    name: "Kingston",
    geo: { lat: 51.4123, lon: -0.3007 },
  },
};

const STATIONS = [
  {
    slug: "kings-cross-st-pancras",
    name: "King's Cross St. Pancras",
    ...KINGS_CROSS,
    modes: ["Underground"],
  },
];

const CONTEXT: PlaceContext = {
  venues: VENUES,
  stations: STATIONS,
  position: null,
};

describe("parsePlaceRef / formatPlaceRef", () => {
  it.each([
    "here",
    "station:kings-cross-st-pancras",
    "venue:bfi.org.uk-southbank",
    "pin:51.531,-0.123",
  ])("round-trips %s", (raw) => {
    const ref = parsePlaceRef(raw);
    expect(ref).not.toBeNull();
    expect(formatPlaceRef(ref!)).toBe(raw);
  });

  // A pin in a shared link should not say which house it was dropped on.
  it("rounds a pin to about 100m", () => {
    expect(parsePlaceRef("pin:51.530661,-0.123194")).toEqual({
      kind: "pin",
      lat: 51.531,
      lon: -0.123,
    });
    expect(
      formatPlaceRef({ kind: "pin", lat: 51.530661, lon: -0.123194 }),
    ).toBe("pin:51.531,-0.123");
  });

  it.each([
    "",
    "nowhere",
    "station:",
    "borough:camden",
    "pin:51.5",
    "pin:abc,def",
    // Paris: a typo, not a London cinema trip
    "pin:48.857,2.352",
  ])("rejects %j", (raw) => {
    expect(parsePlaceRef(raw)).toBeNull();
  });
});

describe("parseRadius", () => {
  it("reads miles, bare or labelled", () => {
    expect(parseRadius("1")).toBe(1);
    expect(parseRadius("0.5mi")).toBe(0.5);
    expect(parseRadius(" 2 MI ")).toBe(2);
  });

  it("converts kilometres to miles", () => {
    expect(parseRadius("2km")).toBeCloseTo(1.243, 3);
  });

  // A link asking for 50 miles still means "a long way", not "ignore me".
  it("clamps rather than rejecting an out-of-range radius", () => {
    expect(parseRadius("50mi")).toBe(MAX_RADIUS_MILES);
    expect(parseRadius("0.01")).toBe(MIN_RADIUS_MILES);
  });

  it.each(["", "0", "-1", "far", "2 furlongs"])("rejects %j", (raw) => {
    expect(parseRadius(raw)).toBeNull();
  });

  it("writes miles, at the precision a link needs", () => {
    expect(formatRadius(1)).toBe("1mi");
    expect(formatRadius(2 / 1.609344)).toBe("1.24mi");
  });

  it("labels a radius as prose", () => {
    expect(formatRadiusLabel(0.5)).toBe("half a mile");
    expect(formatRadiusLabel(1)).toBe("1 mile");
    expect(formatRadiusLabel(1.2427)).toBe("1.2 miles");
  });
});

describe("resolvePlace", () => {
  it("names and places a station", () => {
    expect(
      resolvePlace(
        { kind: "station", slug: "kings-cross-st-pancras" },
        CONTEXT,
      ),
    ).toEqual({ label: "King's Cross St. Pancras", point: KINGS_CROSS });
  });

  it("names and places a venue", () => {
    expect(
      resolvePlace({ kind: "venue", id: "bfi.org.uk-southbank" }, CONTEXT),
    ).toEqual({
      label: "BFI Southbank",
      point: VENUES["bfi.org.uk-southbank"].geo,
    });
  });

  it("places 'here' at the reader's position, once known", () => {
    const here = { kind: "here" } as const;
    expect(resolvePlace(here, CONTEXT)).toBeNull();
    expect(isPlaceResolvable(here, CONTEXT)).toBe(false);

    const located = { ...CONTEXT, position: KINGS_CROSS };
    expect(resolvePlace(here, located)).toEqual({
      label: "you",
      point: KINGS_CROSS,
    });
  });

  // Null either way, but only one of them means the place doesn't exist.
  it("tells a station not yet loaded from one that isn't listed", () => {
    const ref = { kind: "station", slug: "atlantis" } as const;
    expect(resolvePlace(ref, CONTEXT)).toBeNull();
    expect(isPlaceResolvable(ref, CONTEXT)).toBe(true);
    expect(isPlaceResolvable(ref, { ...CONTEXT, stations: null })).toBe(false);
  });

  it("falls back to a readable name before resolving", () => {
    expect(
      getPlaceFallbackLabel({
        kind: "station",
        slug: "kings-cross-st-pancras",
      }),
    ).toBe("Kings Cross St Pancras");
    expect(getPlaceFallbackLabel({ kind: "here" })).toBe("you");
  });
});

describe("getVenueIdsWithin", () => {
  it("returns the venues inside the radius, nearest first", () => {
    expect(getVenueIdsWithin(KINGS_CROSS, 2, VENUES)).toEqual([
      "everyman.co.uk-kings-cross",
      "bfi.org.uk-southbank",
    ]);
  });

  // Unlike Venues Near Me, the radius is never grown to find more.
  it("returns nothing rather than reaching further", () => {
    expect(getVenueIdsWithin(KINGS_CROSS, 0.1, VENUES)).toEqual([]);
  });
});

describe("the station list", () => {
  it("loads, with unique slugs, inside London", async () => {
    const stations = await loadStations();
    expect(stations.length).toBeGreaterThan(300);
    expect(new Set(stations.map((s) => s.slug)).size).toBe(stations.length);
    for (const station of stations) {
      expect(parsePlaceRef(`pin:${station.lat},${station.lon}`)).not.toBeNull();
    }
    expect(stations.find((s) => s.slug === "kings-cross-st-pancras")).toEqual(
      expect.objectContaining({ name: "King's Cross St. Pancras" }),
    );
  });
});
