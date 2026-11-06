import type { Movie, Venue } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import { FORMATS, FORMAT_SECTIONS, type FormatKind } from "@/data/formats";
import { FormatSource } from "@/types";
import { getFormatUrl } from "@/utils/get-format-url";
import { getFormatMovies } from "@/utils/get-format-movies";
import {
  getProgrammeSummary,
  pickPosters,
  type ProgrammePoster,
} from "@/utils/get-programme-summary";
import { formatDayAndDate } from "@/utils/format-date";

/**
 * Below this many showings a format is rare enough that its next screening is
 * the thing to know. Above it there is always one within the hour, so naming
 * it would be a lottery.
 */
export const RARE_FORMAT_SHOWINGS = 20;

/** Sources that play from a print rather than a digital file or tape. */
export const FILM_SOURCES: FormatSource[] = [
  FormatSource.SeventyMm,
  FormatSource.ImaxSeventyMm,
  FormatSource.ThirtyFiveMm,
  FormatSource.SixteenMm,
  FormatSource.Nitrate,
];

export type FormatListItem = {
  id: string;
  kind: FormatKind;
  name: string;
  href: string;
  imagePath: string | null;
  seoDescription: string;
  movieCount: number;
  performanceCount: number;
  venueCount: number;
  /** Named only when the format is at a single venue: "Only at BFI IMAX". */
  onlyVenue: string | null;
  /** The next bookable screening, for rare formats only. */
  next: { title: string; when: string } | null;
  posters: ProgrammePoster[];
};

/** One rendered section of the index: a heading, its intro and its formats. */
export type FormatSection = {
  id: string;
  title: string;
  intro: string;
  formats: FormatListItem[];
};

/**
 * Everything `/formats` shows: the formats with something on, grouped into
 * their sections, and the formats with nothing on, which the page names in a
 * line rather than giving each a card that says so.
 *
 * Image paths are passed in, since the page resolves them from the filesystem.
 */
export function getFormatsIndex(
  movies: MoviesRecord,
  venues: Record<string, Venue>,
  {
    now,
    getImagePath,
  }: { now: number; getImagePath: (slug: string) => string | null },
): {
  formats: FormatListItem[];
  sections: FormatSection[];
  emptyFormats: FormatListItem[];
} {
  // Posters are picked in display order, each card preferring films no earlier
  // card has used. Genres can lean on a film's first-listed genre for this;
  // formats have no such thing, and the same release is often on the 70mm,
  // IMAX 70mm and IMAX cards at once.
  const usedPosters = new Set<string>();

  const formats = FORMATS.map((format): FormatListItem => {
    const formatMovies = getFormatMovies(format, movies, now);

    const venueIds = new Set<string>();
    for (const { movie } of formatMovies) {
      for (const performance of movie.performances) {
        const venueId = movie.showings[performance.showingId]?.venueId;
        if (venueId) venueIds.add(venueId);
      }
    }
    const performanceCount = formatMovies.reduce(
      (total, { performanceCount }) => total + performanceCount,
      0,
    );

    let onlyVenue: string | null = null;
    if (venueIds.size === 1) {
      const [venueId] = venueIds;
      const venue = venues[venueId];
      if (!venue) {
        throw new Error(
          `Format "${format.slug}" has showings at unknown venue "${venueId}".`,
        );
      }
      onlyVenue = venue.name;
    }

    let next: FormatListItem["next"] = null;
    if (performanceCount > 0 && performanceCount < RARE_FORMAT_SHOWINGS) {
      const summary = getProgrammeSummary(
        Object.fromEntries(formatMovies.map(({ movie }) => [movie.id, movie])),
        { now, posterLimit: 0 },
      );
      next = summary.next && {
        title: summary.next.movie.title,
        when: formatDayAndDate(summary.next.time),
      };
    }

    // Busiest first, as the genre cards take them: the films with the most
    // showings in a format are the ones it's being used for. Sorted on a
    // copy, since the movies are the shared dataset's.
    const isUsed = (movie: Movie) => (usedPosters.has(movie.id) ? 1 : 0);
    const busiest = [...formatMovies]
      .sort(
        (a, b) =>
          isUsed(a.movie) - isUsed(b.movie) ||
          b.performanceCount - a.performanceCount ||
          a.movie.title.localeCompare(b.movie.title),
      )
      .map(({ movie }) => movie);
    const posters = pickPosters(busiest);
    for (const movie of busiest.slice(0, posters.length)) {
      usedPosters.add(movie.id);
    }

    return {
      id: format.id,
      kind: format.kind,
      name: format.name,
      href: getFormatUrl(format),
      imagePath: getImagePath(format.slug),
      seoDescription: format.seoDescription,
      movieCount: formatMovies.length,
      performanceCount,
      venueCount: venueIds.size,
      onlyVenue,
      next,
      posters,
    };
  });

  // Empty sections are dropped so the page never renders a heading over
  // nothing. Formats keep their registry order within a section.
  const sections: FormatSection[] = FORMAT_SECTIONS.map(
    ({ id, title, intro, kinds }) => ({
      id,
      title,
      intro,
      formats: formats.filter(
        (format) => kinds.includes(format.kind) && format.movieCount > 0,
      ),
    }),
  ).filter((section) => section.formats.length > 0);

  return {
    formats,
    sections,
    emptyFormats: formats.filter((format) => format.movieCount === 0),
  };
}

/** The catalogue filtered to every format played from a print. */
export function getFilmSourcesUrl(): string {
  return `/catalogue?base=all&source=${FILM_SOURCES.join(",")}`;
}
