import type { Movie } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import { matchAny } from "@/lib/filters/manager";
import { FilterId } from "@/lib/filters/types";
import { getProgrammeFilterUrl } from "@/lib/filters/modules/programmes";
import { FESTIVALS } from "@/data/festivals";
import { getFestivalUrl } from "@/utils/get-festival-url";
import {
  getFestivalMovies,
  getFestivalDateRange,
} from "@/utils/get-festival-movies";
import {
  getProgrammeSummary,
  getProgrammeRow,
  type ProgrammePoster,
} from "@/utils/get-programme-summary";
import { formatDayAndDate, MS_PER_DAY } from "@/utils/format-date";

/**
 * A festival screening inside this window is "this week"; the rest are
 * "coming up". A window rather than "has started", because the listings only
 * hold what venues still publish: a festival's opening night drops out of the
 * data once it has been and gone, so whether one has started can't be read
 * reliably from its earliest screening.
 */
const THIS_WEEK_DAYS = 7;

export type FestivalListItem = {
  id: string;
  name: string;
  href: string;
  externalUrl?: string;
  imagePath: string | null;
  movieCount: number;
  posters: ProgrammePoster[];
  next: { title: string; when: string } | null;
  /** Earliest screening in the listings, finished ones included. */
  dateFrom: number | null;
  dateTo: number | null;
  /** Has a screening within the next week. */
  thisWeek: boolean;
  seoDescription: string | null;
};

export interface FeaturedFestival {
  festival: FestivalListItem;
  /** Its films, soonest first, subtitled with the date each is next on. */
  films: { movie: Movie; subtitle: string }[];
  catalogueHref: string;
  plannerHref: string;
}

/**
 * Everything `/festivals` shows: each festival with something on, in
 * start-date order, and the one the page leads with. Image paths and blurbs
 * are passed in, since the page resolves them from the filesystem and the
 * stories can't.
 */
export function getFestivalsIndex(
  movies: MoviesRecord,
  {
    now = Date.now(),
    getImagePath,
    descriptions = {},
  }: {
    now?: number;
    getImagePath: (id: string) => string | null;
    descriptions?: Record<string, string | null>;
  },
): { festivals: FestivalListItem[]; featured: FeaturedFestival | null } {
  const festivals = FESTIVALS.flatMap((festival): FestivalListItem[] => {
    const festivalMovies = getFestivalMovies(festival, movies);
    if (Object.keys(festivalMovies).length === 0) return [];

    // The range runs from the earliest screening still in the listings,
    // finished ones included, so a festival already under way reads as having
    // started rather than as starting with its next screening.
    const { dateFrom } = getFestivalDateRange(
      matchAny(festival.matchers, movies),
    );
    const { dateFrom: nextFrom, dateTo } = getFestivalDateRange(festivalMovies);
    const { movieCount, posters, next } = getProgrammeSummary(festivalMovies, {
      now,
    });

    return [
      {
        id: festival.id,
        name: festival.name,
        href: getFestivalUrl(festival),
        externalUrl: festival.url,
        imagePath: getImagePath(festival.id),
        movieCount,
        posters,
        next: next && {
          title: next.movie.title,
          when: formatDayAndDate(next.time),
        },
        dateFrom: dateFrom ?? nextFrom,
        dateTo,
        thisWeek:
          nextFrom !== null && nextFrom < now + THIS_WEEK_DAYS * MS_PER_DAY,
        seoDescription: descriptions[festival.id] ?? null,
      },
    ];
  });

  // Soonest first, so the page reads in the order the festivals happen.
  festivals.sort(
    (a, b) =>
      (a.dateFrom ?? Infinity) - (b.dateFrom ?? Infinity) ||
      a.name.localeCompare(b.name),
  );

  // The biggest festival with something on this week leads the page; failing
  // that, the next one to start. Size rather than date because a week often
  // holds a two-week festival and a one-night all-dayer, and the bigger
  // programme is the better reason to have opened the page.
  const thisWeek = festivals.filter((f) => f.thisWeek);
  const featuredItem =
    thisWeek.length > 0
      ? thisWeek.reduce((best, f) =>
          f.movieCount > best.movieCount ? f : best,
        )
      : festivals[0];
  const featuredFestival = FESTIVALS.find((f) => f.id === featuredItem?.id);

  const featured: FeaturedFestival | null =
    featuredItem && featuredFestival
      ? {
          festival: featuredItem,
          films: getProgrammeRow(getFestivalMovies(featuredFestival, movies), {
            now,
          }),
          catalogueHref: getProgrammeFilterUrl(
            "/catalogue",
            FilterId.Festivals,
            featuredItem.id,
          ),
          plannerHref: getProgrammeFilterUrl(
            "/planner",
            FilterId.Festivals,
            featuredItem.id,
          ),
        }
      : null;

  return { festivals, featured };
}
