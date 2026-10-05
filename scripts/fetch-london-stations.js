/* eslint-disable */
/**
 * Builds src/data/london-stations.json from TfL's open data: one entry per
 * station on the Underground, Overground, Elizabeth line and DLR, which is how
 * Londoners and visitors alike say where they'll be ("near King's Cross").
 *
 * Generated rather than fetched at build time: stations change on the scale of
 * years, and a build should not depend on TfL's API being up. Rerun with
 * `npm run fetch-london-stations` when one opens, and commit the result.
 *
 * TfL lists a station once per mode, and again for every entrance, platform
 * and access area. Only station-level stops are kept, then interchanges are
 * merged: by TfL's hub code where it has one (Bank's DLR and Underground
 * stations are HUBBAN), else by name within half a kilometre (Edgware Road's
 * two Underground stations carry none). A merged station sits at the average
 * of its parts.
 *
 * Powered by TfL Open Data. Contains OS data © Crown copyright and database
 * rights 2016, and Geomni UK Map data © and database rights 2019.
 */
const fs = require("node:fs");
const path = require("node:path");

const MODES = {
  tube: "Underground",
  overground: "Overground",
  "elizabeth-line": "Elizabeth line",
  dlr: "DLR",
};
const STATION_TYPES = new Set(["NaptanMetroStation", "NaptanRailStation"]);
// Greater London, with a little margin. The Elizabeth line runs out to Reading
// and Shenfield, which no reader of a London cinema site means by "near".
const BOUNDS = { minLat: 51.25, maxLat: 51.72, minLon: -0.56, maxLon: 0.34 };
const SAME_NAME_KM = 0.5;
const OUT_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "london-stations.json",
);

/**
 * TfL's names carry the mode ("Bank Underground Station"), the line where one
 * name has two stations ("Edgware Road (Bakerloo)"), and a disambiguator for
 * the national rail network ("Stratford (London)"). None of it is how anyone
 * names the place.
 */
function cleanName(name) {
  return name
    .replace(/[- ](Underground|Rail|DLR) Station$/, "")
    .replace(
      /^London (?=(Liverpool Street|Paddington|Euston|Waterloo|Victoria|Fenchurch Street|Marylebone|Charing Cross|Cannon Street)$)/,
      "",
    )
    .replace(
      / \((London|Berks|Central|Bakerloo|Circle Line|H&C Line|Dist&Picc Line)\)$/,
      "",
    )
    .replace(/ \(for [^)]+\)$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function distanceKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

async function fetchMode(mode) {
  const url = `https://api.tfl.gov.uk/StopPoint/Mode/${mode}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }
  const { stopPoints } = await response.json();
  return stopPoints
    .filter((stop) => STATION_TYPES.has(stop.stopType))
    .map((stop) => ({
      name: cleanName(stop.commonName),
      hub: stop.hubNaptanCode || null,
      lat: stop.lat,
      lon: stop.lon,
      mode: MODES[mode],
    }));
}

function inLondon({ lat, lon }) {
  return (
    lat >= BOUNDS.minLat &&
    lat <= BOUNDS.maxLat &&
    lon >= BOUNDS.minLon &&
    lon <= BOUNDS.maxLon
  );
}

/** Groups stops that are one station: same hub, or same name close by. */
function mergeStops(stops) {
  const groups = [];
  const byHub = new Map();
  for (const stop of stops) {
    let group = stop.hub ? byHub.get(stop.hub) : undefined;
    if (!group) {
      group = groups.find(
        (g) =>
          g.stops.some((s) => s.name === stop.name) &&
          distanceKm(centre(g.stops), stop) <= SAME_NAME_KM,
      );
    }
    if (!group) {
      group = { stops: [] };
      groups.push(group);
    }
    group.stops.push(stop);
    if (stop.hub) byHub.set(stop.hub, group);
  }
  return groups;
}

function centre(stops) {
  return {
    lat: stops.reduce((sum, s) => sum + s.lat, 0) / stops.length,
    lon: stops.reduce((sum, s) => sum + s.lon, 0) / stops.length,
  };
}

/**
 * A hub's parts can be named differently ("Shepherd's Bush" for the Central
 * line, "Shepherds Bush" for the Overground). The Underground's name is the
 * one people know; failing that, the shortest is the plainest.
 */
function pickName(stops) {
  const rank = (stop) => Object.values(MODES).indexOf(stop.mode);
  return [...stops].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      a.name.length - b.name.length ||
      a.name.localeCompare(b.name),
  )[0].name;
}

async function main() {
  const { default: slugify } = await import("@sindresorhus/slugify");

  const stops = (
    await Promise.all(Object.keys(MODES).map((mode) => fetchMode(mode)))
  )
    .flat()
    .filter(inLondon);

  const stations = mergeStops(stops).map(({ stops: parts }) => {
    const { lat, lon } = centre(parts);
    const modes = Object.values(MODES).filter((mode) =>
      parts.some((s) => s.mode === mode),
    );
    const name = pickName(parts);
    return {
      slug: slugify(name),
      name,
      // Five decimal places is about a metre, far finer than a radius needs.
      lat: Number(lat.toFixed(5)),
      lon: Number(lon.toFixed(5)),
      modes,
    };
  });

  stations.sort((a, b) => a.name.localeCompare(b.name));

  const slugs = new Set();
  for (const station of stations) {
    if (slugs.has(station.slug)) {
      throw new Error(`Two stations share the slug "${station.slug}"`);
    }
    slugs.add(station.slug);
  }

  // One station per line: small enough to ship, and still a readable diff.
  const lines = stations.map((station) => "  " + JSON.stringify(station));
  fs.writeFileSync(OUT_FILE, "[\n" + lines.join(",\n") + "\n]\n");
  console.log(`Wrote ${stations.length} stations to ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
