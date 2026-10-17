import { describe, it, expect } from "vitest";
import {
  getDistanceInMiles,
  getNearbyRadius,
  getNearbyVenueIds,
  NEARBY_AREA_CELL_LAT,
  NEARBY_AREA_CELL_LON,
  NEARBY_BASE_RADIUS_MILES,
  NEARBY_MAX_RADIUS_MILES,
} from "./geo-distance";

// The venues with showings around Shoreditch, as the dataset places them.
const SHOREDITCH = [
  {
    id: "loveaffairbasement.co.uk",
    geo: { lat: 51.53108255835564, lon: -0.06674817269659018 },
  },
  {
    id: "museumofthehome.org.uk",
    geo: { lat: 51.53156258729692, lon: -0.07643185053877043 },
  },
  {
    id: "hundredyearsgallery.co.uk",
    geo: { lat: 51.53317547789123, lon: -0.07616324405329827 },
  },
  {
    id: "commonpress.co.uk-shoreditch",
    geo: { lat: 51.524698458307576, lon: -0.07188685705345867 },
  },
  {
    id: "richmix.org.uk",
    geo: { lat: 51.52457570406875, lon: -0.07315388679058897 },
  },
  {
    id: "hackney.gov.uk-shoreditch-library",
    geo: { lat: 51.530555633984754, lon: -0.0801239170691398 },
  },
  {
    id: "courthouse-hotel.com-shoreditch",
    geo: { lat: 51.527405986385006, lon: -0.0795747613921379 },
  },
  {
    id: "closeupfilmcentre.com",
    geo: { lat: 51.52363533860424, lon: -0.07204024586584808 },
  },
  {
    id: "strongroombar.com",
    geo: { lat: 51.52596690314433, lon: -0.08017930429849301 },
  },
  {
    id: "oxfordhouse.org.uk",
    geo: { lat: 51.52641308675776, lon: -0.06129255925617675 },
  },
  {
    id: "curzon.com-hoxton",
    geo: { lat: 51.528902835244836, lon: -0.08378130612326362 },
  },
  {
    id: "naturalphilosopher.co.uk",
    geo: { lat: 51.53251109834914, lon: -0.05881852672635693 },
  },
  {
    id: "artotel.com-hoxton",
    geo: { lat: 51.526156790963746, lon: -0.08333842748307863 },
  },
];
const ALL_SHOWING = new Set(SHOREDITCH.map((venue) => venue.id));

// Two readings of one reader's position, 30m apart: a normal window and a
// private one.
const READING_A = { lat: 51.52996447719218, lon: -0.07112521810367897 };
const READING_B = { lat: 51.53018243617267, lon: -0.07144433886227798 };

describe("getNearbyVenueIds", () => {
  // Worked out at each exact reading, the tenth venue (Oxford House, 0.489 vs
  // 0.508 miles) decided whether the rule stopped at half a mile, and with it
  // whether Curzon Hoxton and three others were in. Blended, the two readings
  // get nearly the same radius: only a venue sitting on its edge can differ
  // (Artotel, 0.587 vs 0.582 miles), never a band of them.
  it("picks almost the same venues from two readings 30m apart", () => {
    const a = getNearbyVenueIds(READING_A, SHOREDITCH, ALL_SHOWING);
    const b = getNearbyVenueIds(READING_B, SHOREDITCH, ALL_SHOWING);
    expect(a).toContain("curzon.com-hoxton");
    expect(b).toContain("curzon.com-hoxton");
    const differ = [
      ...a.filter((id) => !b.includes(id)),
      ...b.filter((id) => !a.includes(id)),
    ];
    expect(differ.length).toBeLessThanOrEqual(1);
  });

  it("returns every venue with showings within the radius, and no others", () => {
    const radius = getNearbyRadius(READING_A, SHOREDITCH);
    const expected = SHOREDITCH.filter(
      (venue) => getDistanceInMiles(READING_A, venue.geo) <= radius,
    ).map((venue) => venue.id);
    expect(getNearbyVenueIds(READING_A, SHOREDITCH, ALL_SHOWING)).toEqual(
      expected,
    );
  });

  // A venue with nothing on neither counts towards the floor nor appears.
  it("ignores venues with nothing showing", () => {
    const showing = new Set(
      [...ALL_SHOWING].filter((id) => id !== "richmix.org.uk"),
    );
    expect(getNearbyVenueIds(READING_A, SHOREDITCH, showing)).not.toContain(
      "richmix.org.uk",
    );
  });

  it("finds nothing when nothing is showing", () => {
    expect(getNearbyVenueIds(READING_A, SHOREDITCH, new Set())).toEqual([]);
  });
});

describe("getNearbyRadius", () => {
  // At a cell's centre the blend is that centre alone: the floor rule there.
  it("is the floor rule at a cell centre", () => {
    const centre = {
      lat:
        (Math.floor(READING_A.lat / NEARBY_AREA_CELL_LAT) + 0.5) *
        NEARBY_AREA_CELL_LAT,
      lon:
        (Math.floor(READING_A.lon / NEARBY_AREA_CELL_LON) + 0.5) *
        NEARBY_AREA_CELL_LON,
    };
    const radius = getNearbyRadius(centre, SHOREDITCH);
    // The floor rule stops at the first step with ten venues inside.
    const inside = (r: number) =>
      SHOREDITCH.filter((venue) => getDistanceInMiles(centre, venue.geo) <= r)
        .length;
    expect(inside(radius)).toBeGreaterThanOrEqual(10);
    if (radius > NEARBY_BASE_RADIUS_MILES) {
      expect(inside(radius - 0.1)).toBeLessThan(10);
    }
  });

  // Walking a kilometre east in 10m steps, the radius never jumps.
  it("changes gradually as the reader moves", () => {
    const metresToLon =
      1 / (111320 * Math.cos((READING_A.lat * Math.PI) / 180));
    let previous = getNearbyRadius(READING_A, SHOREDITCH);
    for (let metres = 10; metres <= 1000; metres += 10) {
      const radius = getNearbyRadius(
        { lat: READING_A.lat, lon: READING_A.lon + metres * metresToLon },
        SHOREDITCH,
      );
      expect(Math.abs(radius - previous)).toBeLessThan(0.01);
      previous = radius;
    }
  });

  it("stays between half a mile and the ceiling", () => {
    const radius = getNearbyRadius(READING_A, SHOREDITCH);
    expect(radius).toBeGreaterThanOrEqual(NEARBY_BASE_RADIUS_MILES);
    expect(radius).toBeLessThanOrEqual(NEARBY_MAX_RADIUS_MILES);
  });

  // Where venues are sparse it widens all the way, as the floor rule does.
  it("reaches the ceiling where there aren't ten venues", () => {
    expect(getNearbyRadius(READING_A, SHOREDITCH.slice(0, 3))).toBeCloseTo(
      NEARBY_MAX_RADIUS_MILES,
    );
  });
});
