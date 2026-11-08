import { FormatSource, type CinemaData } from "@/types";
import {
  DEFAULT_CATEGORIES,
  getPrimaryCategory,
} from "@/lib/filters/modules/categories";
import { MS_PER_DAY } from "@/utils/format-date";

/** The window the home page's counts cover. */
export const LISTINGS_STATS_DAYS = 7;

export interface ListingsStats {
  /** Films (the catalogue's default categories) with a showing in the window. */
  films: number;
  /** Their showings in the window. */
  screenings: number;
  /** Venues holding at least one of those showings. */
  venues: number;
  /** Every venue in the dataset, showing anything or not. */
  venuesTracked: number;
  /** Those showings projected from a 35mm print, and the films they are of. */
  thirtyFiveMm: { screenings: number; films: number };
}

/**
 * The scale of the listings for the home page: what is on in the coming week,
 * counted over the same categories the catalogue shows by default so the films
 * figure is roughly what its link opens on.
 *
 * `venueIds` narrows every figure to those venues (a borough, say), so a part
 * of London is counted by the same rule as the whole of it. `venuesTracked` is
 * then the number of those venues the dataset holds.
 */
export function getListingsStats(
  data: Pick<CinemaData, "movies" | "venues">,
  now: number,
  venueIds?: ReadonlySet<string>,
): ListingsStats {
  const end = now + LISTINGS_STATS_DAYS * MS_PER_DAY;
  const venues = new Set<string>();
  let films = 0;
  let screenings = 0;
  let thirtyFiveMmScreenings = 0;
  let thirtyFiveMmFilms = 0;

  for (const movie of Object.values(data.movies)) {
    if (!DEFAULT_CATEGORIES.includes(getPrimaryCategory(movie))) continue;

    let showing = false;
    let onThirtyFiveMm = false;
    for (const performance of movie.performances) {
      if (performance.time < now || performance.time >= end) continue;
      const venueId = movie.showings[performance.showingId]?.venueId;
      if (venueIds && (!venueId || !venueIds.has(venueId))) continue;
      showing = true;
      screenings++;
      if (venueId) venues.add(venueId);
      if (performance.format?.source === FormatSource.ThirtyFiveMm) {
        thirtyFiveMmScreenings++;
        onThirtyFiveMm = true;
      }
    }
    if (showing) films++;
    if (onThirtyFiveMm) thirtyFiveMmFilms++;
  }

  return {
    films,
    screenings,
    venues: venues.size,
    venuesTracked: venueIds
      ? Object.keys(data.venues).filter((id) => venueIds.has(id)).length
      : Object.keys(data.venues).length,
    thirtyFiveMm: {
      screenings: thirtyFiveMmScreenings,
      films: thirtyFiveMmFilms,
    },
  };
}
