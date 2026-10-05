import { describe, it, expect } from "vitest";
import {
  describeVenueOrigin,
  formatPlaceRef,
  formatRadiusLabel,
  getVenueIdsNear,
  getVenueIdsWithin,
  isVenueOriginCurrent,
  loadStations,
  parsePlaceRef,
  resolvePlace,
  type PlaceContext,
  type VenueOrigin,
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
  ])("round-trips %s", (raw) => {
    const ref = parsePlaceRef(raw);
    expect(ref).not.toBeNull();
    expect(formatPlaceRef(ref!)).toBe(raw);
  });

  it.each(["", "nowhere", "station:", "borough:camden", "pin:51.5,-0.1"])(
    "rejects %j",
    (raw) => {
      expect(parsePlaceRef(raw)).toBeNull();
    },
  );
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
    expect(resolvePlace({ kind: "here" }, CONTEXT)).toBeNull();
    expect(
      resolvePlace({ kind: "here" }, { ...CONTEXT, position: KINGS_CROSS }),
    ).toEqual({ label: "you", point: KINGS_CROSS });
  });

  it("knows nothing of a station the list doesn't hold", () => {
    expect(
      resolvePlace({ kind: "station", slug: "atlantis" }, CONTEXT),
    ).toBeNull();
  });
});

describe("getVenueIdsWithin", () => {
  it("returns the venues inside the radius, nearest first", () => {
    expect(getVenueIdsWithin(KINGS_CROSS, 2, VENUES)).toEqual([
      "everyman.co.uk-kings-cross",
      "bfi.org.uk-southbank",
    ]);
  });

  // A number is the reader's, never grown to find more.
  it("returns nothing rather than reaching further", () => {
    expect(getVenueIdsWithin(KINGS_CROSS, 0.1, VENUES)).toEqual([]);
  });
});

describe("getVenueIdsNear", () => {
  it("takes a number as a fixed radius", () => {
    expect(getVenueIdsNear(KINGS_CROSS, 0.5, VENUES)).toEqual([
      "everyman.co.uk-kings-cross",
    ]);
  });

  // Auto is Venues Near Me's rule: widen from half a mile, looking for ten
  // venues, but never past two miles.
  it("widens on auto, up to two miles", () => {
    expect(getVenueIdsNear(KINGS_CROSS, "auto", VENUES)).toEqual([
      "bfi.org.uk-southbank",
      "everyman.co.uk-kings-cross",
    ]);
  });

  // A selection is a set, so the same venues always make the same URL —
  // here nearest first would put the Everyman ahead.
  it("returns ids sorted, not nearest first", () => {
    expect(getVenueIdsNear(KINGS_CROSS, 2, VENUES)).toEqual([
      "bfi.org.uk-southbank",
      "everyman.co.uk-kings-cross",
    ]);
  });
});

describe("the remembered origin", () => {
  const origin: VenueOrigin = {
    place: "station:kings-cross-st-pancras",
    label: "King's Cross St. Pancras",
    point: KINGS_CROSS,
    radius: 2,
    venues: ["a", "b"],
  };

  // It stands for the selection only while the selection is what it picked.
  it("is current only while the selection is exactly its venues", () => {
    expect(isVenueOriginCurrent(origin, ["b", "a"])).toBe(true);
    expect(isVenueOriginCurrent(origin, ["a"])).toBe(false);
    expect(isVenueOriginCurrent(origin, ["a", "b", "c"])).toBe(false);
    expect(isVenueOriginCurrent(origin, null)).toBe(false);
    expect(isVenueOriginCurrent(null, ["a", "b"])).toBe(false);
  });

  it("describes a fixed radius and an automatic one", () => {
    expect(describeVenueOrigin(origin)).toBe(
      "Within 2 miles of King's Cross St. Pancras",
    );
    expect(describeVenueOrigin({ label: "you", radius: "auto" })).toBe(
      "Near you",
    );
  });

  it("labels a radius as prose", () => {
    expect(formatRadiusLabel(0.5)).toBe("half a mile");
    expect(formatRadiusLabel(1)).toBe("1 mile");
    expect(formatRadiusLabel(3)).toBe("3 miles");
  });
});

describe("the station list", () => {
  it("loads, with unique slugs, inside London", async () => {
    const stations = await loadStations();
    expect(stations.length).toBeGreaterThan(300);
    expect(new Set(stations.map((s) => s.slug)).size).toBe(stations.length);
    for (const station of stations) {
      expect(station.lat).toBeGreaterThan(51.2);
      expect(station.lat).toBeLessThan(51.75);
      expect(station.lon).toBeGreaterThan(-0.6);
      expect(station.lon).toBeLessThan(0.4);
    }
    expect(stations.find((s) => s.slug === "kings-cross-st-pancras")).toEqual(
      expect.objectContaining({ name: "King's Cross St. Pancras" }),
    );
  });
});
