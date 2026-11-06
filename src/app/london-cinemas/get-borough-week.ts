import type { CinemaData, Venue } from "@/types";
import type { BoroughMapItem } from "@/components/borough-map";
import { getBoroughUrl } from "@/utils/get-borough-url";
import { getBoroughMapShapes } from "@/utils/get-borough-map-shapes";
import {
  FILM_BAND_LABELS,
  describeBoroughWeek,
  getBoroughStats,
  getFilmBand,
} from "@/utils/get-borough-stats";

export type BoroughWeekItem = {
  slug: string;
  name: string;
  /** Only boroughs with a venue have a page. */
  href?: string;
  films: number;
};

export interface BoroughWeek {
  map: { viewBox: string; items: BoroughMapItem[]; bands: string[] };
  /** Every borough, including any with no venue. */
  week: BoroughWeekItem[];
}

/**
 * The map and table on /london-cinemas, shared by the page and its story so
 * the two can't describe a borough differently.
 */
export function getBoroughWeek(
  data: Pick<CinemaData, "movies" | "venues">,
  venuesByBorough: Map<string, Venue[]>,
  now: number,
): BoroughWeek {
  const stats = getBoroughStats(data, venuesByBorough, now);
  const shapes = getBoroughMapShapes();
  const hrefOf = (entry: (typeof stats)[number]) =>
    entry.venueCount > 0 ? getBoroughUrl(entry.borough) : undefined;

  return {
    map: {
      viewBox: shapes.viewBox,
      bands: FILM_BAND_LABELS,
      items: stats.map((entry) => ({
        key: entry.borough.slug,
        label: entry.borough.name,
        path: shapes.paths[entry.borough.slug],
        href: hrefOf(entry),
        band: getFilmBand(entry),
        readout: describeBoroughWeek(entry),
      })),
    },
    week: stats.map((entry) => ({
      slug: entry.borough.slug,
      name: entry.borough.name,
      href: hrefOf(entry),
      films: entry.week.films,
    })),
  };
}
