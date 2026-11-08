import type { CinemaData, Movie } from "@/types";
import type {
  EditorialHighlightKind,
  EditorialSummary,
} from "@/utils/get-editorial-summary";
import { getMovieUrl, SHOW_ALL_HASH } from "@/utils/get-movie-url";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getRating } from "@/utils/movie-ratings.mjs";
import {
  formatRelativeDay,
  formatShowingTime,
  MS_PER_DAY,
} from "@/utils/format-date";
import { findSummaryMentions } from "@/utils/summary-mentions";

/** The home page's picks: at most this many, in the order the summary names them. */
export const FEATURED_LIMIT = 6;

/** The Tag colour a highlight reads as, by what kind of reason it is. */
export type FeaturedTone = "pink" | "blue" | "yellow" | "gray";

const TONE_BY_KIND: Record<EditorialHighlightKind, FeaturedTone> = {
  // How the film is projected, like the format pages.
  format: "blue",
  new: "blue",
  // Nights that won't come round again.
  occasion: "pink",
  "one-off": "pink",
  "hidden-gem": "pink",
  // Time-sensitive: the yellow of the planner's "Last chance".
  "final-showing": "yellow",
  "unusual-venue": "gray",
  popular: "gray",
};

export interface FeaturedScreening {
  movieId: string;
  title: string;
  /** The film's page, opened on its full schedule as the summary's links are. */
  href: string;
  posterPath?: string;
  label: string;
  tone: FeaturedTone;
  /** "Akira Kurosawa · 1985", or whichever half is known. */
  credit: string | null;
  /** "4.5/5 on Letterboxd" — the summary's own rating source. */
  rating: string | null;
  overview: string | null;
  trailerUrl: string | null;
  /** The showing the highlight is about, when it is about one. */
  performance: {
    time: number;
    venueName: string;
    venueHref: string;
  } | null;
  /** Showings in the coming week, for a film featured for its reach. */
  weekShowings: number;
}

function getCredit(movie: Movie, data: CinemaData): string | null {
  const directors = (movie.directors ?? [])
    .map((id) => data.people[id]?.name)
    .filter((name): name is string => Boolean(name));
  const parts = [
    directors.length > 0 ? directors.join(" & ") : null,
    movie.year ?? null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * The films the editorial summary actually names, in the order it names them,
 * each with the reason `generate-summary` picked it and the showing that reason
 * is about. The summary's links cover every candidate the model was shown, most
 * of which the prose leaves out, so a film is featured only once the text
 * mentions it.
 *
 * Skipped rather than guessed: a link from a summary written before highlights
 * existed, a film the dataset no longer holds, and a highlighted showing that
 * has already started (the summary is a build-time snapshot).
 */
export function getFeaturedScreenings(
  summary: EditorialSummary | null,
  data: CinemaData,
  now: number,
  limit: number = FEATURED_LIMIT,
): FeaturedScreening[] {
  if (!summary) return [];

  // Matched over every link, venues included, exactly as the prose's links
  // are: a film title inside a venue's name is the venue's, not the film's.
  const links = summary.links ?? [];
  const mentioned = findSummaryMentions(
    summary.text,
    links.map((link) => link.phrase),
  ).flatMap(({ phrase }) =>
    links.filter(
      (link) =>
        link.phrase.toLowerCase() === phrase.toLowerCase() &&
        link.movieId &&
        link.highlight,
    ),
  );

  const weekEnd = now + 7 * MS_PER_DAY;
  const seen = new Set<string>();
  const featured: FeaturedScreening[] = [];

  for (const link of mentioned) {
    const movieId = link.movieId!;
    const highlight = link.highlight!;
    const movie = data.movies[movieId];
    if (!movie || seen.has(movieId)) continue;

    let performance: FeaturedScreening["performance"] = null;
    if (highlight.performance) {
      const venue = data.venues[highlight.performance.venueId];
      if (!venue || highlight.performance.time < now) continue;
      performance = {
        time: highlight.performance.time,
        venueName: venue.name,
        venueHref: getVenueUrl(venue),
      };
    }

    const weekShowings = movie.performances.filter(
      (p) => p.time >= now && p.time < weekEnd,
    ).length;
    if (!performance && weekShowings === 0) continue;

    seen.add(movieId);
    featured.push({
      movieId,
      title: movie.title,
      href: `${getMovieUrl(movie)}${SHOW_ALL_HASH}`,
      posterPath: movie.posterPath,
      label: highlight.label,
      tone: TONE_BY_KIND[highlight.kind] ?? "gray",
      credit: getCredit(movie, data),
      rating: getRating(movie)?.text ?? null,
      overview: movie.overview ?? null,
      trailerUrl: movie.youtubeTrailer
        ? `https://www.youtube.com/watch?v=${movie.youtubeTrailer}`
        : null,
      performance,
      weekShowings,
    });
    if (featured.length >= limit) break;
  }

  return featured;
}

/** "Tomorrow, 19:30", "Sunday, 19:30", or "Tue 10 Nov, 18:00" a week or more out. */
export function formatFeaturedWhen(time: number, now: number): string {
  return `${formatRelativeDay(time, now)}, ${formatShowingTime(time)}`;
}

/**
 * The featured screenings still to come at `now`. The list is built at build
 * time; the page drops a showing that has started since.
 */
export function getUpcomingFeatured(
  featured: FeaturedScreening[],
  now: number,
): FeaturedScreening[] {
  return featured.filter(
    (item) => !item.performance || item.performance.time >= now,
  );
}
