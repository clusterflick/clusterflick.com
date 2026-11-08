import type { CinemaData, Venue } from "@/types";
import { LONDON_BOROUGHS, type LondonBorough } from "@/data/london-boroughs";
import { getListingsStats, type ListingsStats } from "./get-listings-stats";

export interface BoroughStats {
  borough: LondonBorough;
  /** Venues the dataset places in the borough, showing anything or not. */
  venueCount: number;
  /** The coming week there, by the home page's rule. */
  week: ListingsStats;
}

/**
 * What's on in each London borough in the coming week, in `LONDON_BOROUGHS`
 * order. Every borough is listed, including those the dataset has no venue in:
 * that is a finding about the borough, not a gap to leave out.
 */
export function getBoroughStats(
  data: Pick<CinemaData, "movies" | "venues">,
  venuesByBorough: Map<string, Venue[]>,
  now: number,
): BoroughStats[] {
  return LONDON_BOROUGHS.map((borough) => {
    const venues = venuesByBorough.get(borough.slug) ?? [];
    return {
      borough,
      venueCount: venues.length,
      week: getListingsStats(data, now, new Set(venues.map((v) => v.id))),
    };
  });
}

/**
 * Lower edges of the map's bands, in films showing in the week. Fixed rather
 * than quantiles of this week's spread, so a borough's shade means the same
 * thing from one week to the next and a quiet week reads as one.
 */
export const FILM_BAND_FLOORS = [1, 10, 30, 50, 100] as const;

export const FILM_BAND_LABELS = FILM_BAND_FLOORS.map((floor, index) => {
  const next = FILM_BAND_FLOORS[index + 1];
  if (next === undefined) return `${floor}+`;
  if (floor === 1) return `Under ${next}`;
  return `${floor}–${next - 1}`;
});

/** The map band for a borough: an index into the floors, or why it has none. */
export function getFilmBand(
  stats: Pick<BoroughStats, "venueCount" | "week">,
): number | "nothing-on" | "no-venues" {
  if (stats.venueCount === 0) return "no-venues";
  if (stats.week.films === 0) return "nothing-on";
  let band = 0;
  FILM_BAND_FLOORS.forEach((floor, index) => {
    if (stats.week.films >= floor) band = index;
  });
  return band;
}

const plural = (count: number, word: string) =>
  `${count.toLocaleString("en-GB")} ${word}${count === 1 ? "" : "s"}`;

/**
 * What a borough's week comes to, for the line beside its name: "4 films
 * across 4 screenings, at 3 of its 16 venues". Says how many of its venues had
 * anything on, because a borough full of venues with nothing on is the finding
 * the map exists to show. Screenings sit beside films so both are to hand: the
 * map is shaded by films, which a multiplex can't inflate.
 */
export function describeBoroughWeek({
  venueCount,
  week,
}: Pick<BoroughStats, "venueCount" | "week">): string {
  if (venueCount === 0) return "No venues listed";
  if (week.films === 0) {
    return `Nothing on at its ${plural(venueCount, "venue")}`;
  }
  let where = `${week.venues.toLocaleString("en-GB")} of its ${plural(venueCount, "venue")}`;
  if (week.venues === venueCount) {
    if (venueCount === 1) where = "its only venue";
    else if (venueCount === 2) where = "both its venues";
    else where = `all ${plural(venueCount, "venue")}`;
  }
  return `${plural(week.films, "film")} across ${plural(week.screenings, "screening")}, at ${where}`;
}
