import type { Movie } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import { Category } from "@/types";
import {
  getPrimaryCategory,
  DEFAULT_CATEGORIES as DEFAULT_CATEGORY_LIST,
} from "@/lib/filters/modules/categories";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import { getRating, isEvergreen } from "@/utils/movie-ratings.mjs";

export { getRating };

/**
 * Helpers for the discovery home page. These run at build time over the full
 * static dataset and curate the rows shown on `/`:
 *
 * - Popular ("Showing Across London"): how widely + how often a film is showing
 *   now. Venue breadth is weighted above raw performance count.
 * - New Additions: screenings newly tracked by Clusterflick (earliest `seen`
 *   within the last week), split by film age into new releases / returning /
 *   classics.
 * - Last Chance: matched films whose final non-sold-out showing is within 3 days.
 * - Marathons: multi-film events (double bills, all-nighters) showing soon.
 *
 * A film may legitimately appear in more than one row — a new blockbuster can be
 * both "Showing Across London" and a new release, which is intentional. Each
 * builder still accepts an `excludeIds` set for callers that do want to keep a
 * film to a single section, but `computeDiscoveryRows` does not dedupe across
 * rows.
 */

// Categories shown by default on the films grid (shared source of truth).
const DEFAULT_CATEGORIES = new Set<Category>(DEFAULT_CATEGORY_LIST);

// Popularity scoring weights — breadth (venues) over frequency (performances).
const VENUE_WEIGHT = 3;
const PERF_WEIGHT = 1;
// Exclude single-venue programming runs from the popular row.
const MIN_VENUES = 2;

// A screening counts as a "new addition" if first seen within this many days.
const NEW_ADDITION_LOOKBACK_DAYS = 7;
// Age bucket boundaries. A film released within ~2 months is a "new release";
// anything older (up to 15 years) is "back on the big screen"; 15+ is a classic.
const NEW_RELEASE_MAX_AGE_DAYS = 60;
const CLASSIC_MIN_AGE_YEARS = 15;
const YEAR_MS = 365.25 * MS_PER_DAY;
// A film is "last chance" if its final non-sold-out showing is within this many days.
const LAST_CHANCE_DAYS = 7;

// The Critics' Picks acclaim bar (review-count floors + the evergreen guard live
// in @/utils/movie-ratings.mjs, shared with the editorial summary script).
const CRITICS_PICK_MIN_RATING = 0.8; // ~4.0/5 Letterboxd, 80% RT, 8.0 IMDb

const DEFAULT_LIMIT = 12;
// Per-row display caps. These are curated highlight rows on horizontal-scroll
// strips, so the caps trade off "enough to browse" against "not the whole tail".
// Marathons are deliberately uncapped — the full set is small and inherently
// special, so we show all of them.
const POPULAR_LIMIT = 18;
const CRITICS_LIMIT = 18;
const NEW_ADDITIONS_LIMIT = 24; // per age bucket
const LAST_CHANCE_LIMIT = 24;
const LONDON_TIMEZONE = "Europe/London";

export interface DiscoveryWindow {
  rangeStart: number;
  rangeEnd: number;
}

export interface ScoredMovie {
  movie: Movie;
  performanceCount: number;
  subtitle?: string;
}

export interface NewAdditions {
  /** Released within the last ~2 months (NEW_RELEASE_MAX_AGE_DAYS) — first-run releases. */
  newReleases: ScoredMovie[];
  /** Released between ~2 months and 15 years ago — back on the big screen. */
  returning: ScoredMovie[];
  /** Released 15+ years ago (CLASSIC_MIN_AGE_YEARS) — classics. */
  classics: ScoredMovie[];
}

export interface DiscoveryRows {
  popular: ScoredMovie[];
  criticsPicks: ScoredMovie[];
  newAdditions: NewAdditions;
  lastChance: ScoredMovie[];
  marathons: ScoredMovie[];
}

/**
 * The discovery window: `start` through the next `days` days, end-exclusive.
 * Defaults to today's London midnight (matching the home grid's 7-day range);
 * pass `start = now` to count only genuinely-upcoming showings.
 */
export function getDiscoveryWindow(
  days = 7,
  start: number = getLondonMidnightTimestamp(),
): DiscoveryWindow {
  return { rangeStart: start, rangeEnd: start + (days + 1) * MS_PER_DAY };
}

function upcomingPerformances(movie: Movie, window: DiscoveryWindow) {
  return movie.performances.filter(
    (p) => p.time >= window.rangeStart && p.time < window.rangeEnd,
  );
}

/**
 * Performances from the window start onwards, with no upper bound — used where a
 * film just needs at least one genuinely-upcoming showing (so it doesn't link to
 * an empty list), regardless of how far out it is.
 */
function futurePerformances(movie: Movie, window: DiscoveryWindow) {
  return movie.performances.filter((p) => p.time >= window.rangeStart);
}

function isDiscoverable(movie: Movie): boolean {
  return DEFAULT_CATEGORIES.has(getPrimaryCategory(movie));
}

/** A "matched" film has been linked to real metadata (TMDB), not just scraped. */
function isMatched(movie: Movie): boolean {
  return !movie.isUnmatched;
}

/** The shape returned by `getRating` (defined in @/utils/movie-ratings.mjs). */
export interface Rating {
  /** Human label, e.g. "4.3/5 on Letterboxd". */
  text: string;
  /** Score normalised to 0–1. */
  norm: number;
}

function formatCount(count: number, singular: string): string {
  return `${count.toLocaleString("en-GB")} ${count === 1 ? singular : `${singular}s`}`;
}

/**
 * Release timestamp from `releaseDate` (preferred, for month-level precision) or
 * `year` (1 Jan of that year); null if neither is known.
 */
function getReleaseTime(movie: Movie): number | null {
  if (movie.releaseDate) {
    const time = Date.parse(movie.releaseDate);
    if (!Number.isNaN(time)) return time;
  }
  if (movie.year) {
    const year = Number.parseInt(movie.year, 10);
    if (!Number.isNaN(year)) return Date.UTC(year, 0, 1);
  }
  return null;
}

/**
 * Films showing most widely over the discovery window, scored by
 * `venueCount * VENUE_WEIGHT + performanceCount * PERF_WEIGHT`. Venue count is
 * derived from the upcoming performances' showings so archived venues don't
 * inflate a film that is now only screening in one place.
 */
export function getPopularMovies(
  movies: MoviesRecord,
  window: DiscoveryWindow = getDiscoveryWindow(),
  limit: number = DEFAULT_LIMIT,
  excludeIds: Set<string> = new Set(),
): ScoredMovie[] {
  return Object.values(movies)
    .filter((movie) => isDiscoverable(movie) && !excludeIds.has(movie.id))
    .map((movie) => {
      const upcoming = upcomingPerformances(movie, window);
      const venueIds = new Set<string>();
      for (const performance of upcoming) {
        const venueId = movie.showings[performance.showingId]?.venueId;
        if (venueId) venueIds.add(venueId);
      }
      return {
        movie,
        performanceCount: upcoming.length,
        venueCount: venueIds.size,
      };
    })
    .filter((s) => s.performanceCount > 0 && s.venueCount >= MIN_VENUES)
    .sort(
      (a, b) =>
        b.venueCount * VENUE_WEIGHT +
        b.performanceCount * PERF_WEIGHT -
        (a.venueCount * VENUE_WEIGHT + a.performanceCount * PERF_WEIGHT),
    )
    .slice(0, limit)
    .map(({ movie, performanceCount, venueCount }) => ({
      movie,
      performanceCount,
      subtitle: `${formatCount(venueCount, "venue")} · ${formatCount(performanceCount, "showing")}`,
    }));
}

/**
 * Matched films whose earliest `seen` is within the last week, split by film age
 * into new releases / returning / classics. Newest-added first within each
 * bucket. Subtitle is the release year. The point of this row is "what just
 * appeared in the system", so it intentionally does NOT require the film to be
 * showing this week — only that it has at least one genuinely-upcoming
 * performance (so the link isn't dead), however far out.
 */
export function getNewAdditions(
  movies: MoviesRecord,
  window: DiscoveryWindow = getDiscoveryWindow(),
  now: number = Date.now(),
  excludeIds: Set<string> = new Set(),
  limitPerBucket: number = DEFAULT_LIMIT,
): NewAdditions {
  const cutoff = now - NEW_ADDITION_LOOKBACK_DAYS * MS_PER_DAY;

  const candidates = Object.values(movies)
    .filter(
      (movie) =>
        isDiscoverable(movie) && isMatched(movie) && !excludeIds.has(movie.id),
    )
    .map((movie) => {
      const seenValues = Object.values(movie.showings)
        .map((showing) => showing.seen)
        .filter((seen): seen is number => typeof seen === "number");
      const earliestSeen = seenValues.length
        ? Math.min(...seenValues)
        : Infinity;
      return {
        movie,
        performanceCount: futurePerformances(movie, window).length,
        earliestSeen,
        releaseTime: getReleaseTime(movie),
      };
    })
    .filter(
      (s) =>
        s.performanceCount > 0 &&
        s.releaseTime !== null &&
        s.earliestSeen !== Infinity &&
        s.earliestSeen >= cutoff,
    )
    .sort((a, b) => b.earliestSeen - a.earliestSeen);

  const result: NewAdditions = {
    newReleases: [],
    returning: [],
    classics: [],
  };

  for (const candidate of candidates) {
    const releaseTime = candidate.releaseTime as number;
    const ageMs = now - releaseTime;
    const scored: ScoredMovie = {
      movie: candidate.movie,
      performanceCount: candidate.performanceCount,
      subtitle: String(new Date(releaseTime).getUTCFullYear()),
    };
    if (ageMs > CLASSIC_MIN_AGE_YEARS * YEAR_MS) {
      if (result.classics.length < limitPerBucket) result.classics.push(scored);
    } else if (ageMs <= NEW_RELEASE_MAX_AGE_DAYS * MS_PER_DAY) {
      if (result.newReleases.length < limitPerBucket)
        result.newReleases.push(scored);
    } else {
      if (result.returning.length < limitPerBucket)
        result.returning.push(scored);
    }
  }

  return result;
}

/**
 * Venue-scoped "just added": matched films with a showing at this venue first
 * seen within the last week that still has at least one upcoming performance at
 * the venue (so the link isn't dead). One flat, newest-added-first row — the
 * per-venue analogue of {@link getNewAdditions}, without the age buckets, for the
 * "Just added" poster row on the venue page. Recency is conveyed by the row
 * itself, so the poster subtitle falls back to the film's year.
 */
export function getVenueNewAdditions(
  movies: MoviesRecord,
  venueId: string,
  now: number = Date.now(),
  window: DiscoveryWindow = getDiscoveryWindow(),
  limit: number = DEFAULT_LIMIT,
): ScoredMovie[] {
  const cutoff = now - NEW_ADDITION_LOOKBACK_DAYS * MS_PER_DAY;

  return Object.values(movies)
    .filter((movie) => isDiscoverable(movie) && isMatched(movie))
    .map((movie) => {
      const venueShowingIds = new Set<string>();
      let earliestSeen = Infinity;
      for (const [showingId, showing] of Object.entries(movie.showings)) {
        if (showing.venueId !== venueId) continue;
        venueShowingIds.add(showingId);
        if (typeof showing.seen === "number" && showing.seen < earliestSeen) {
          earliestSeen = showing.seen;
        }
      }
      const performanceCount = movie.performances.filter(
        (p) => venueShowingIds.has(p.showingId) && p.time >= window.rangeStart,
      ).length;
      return { movie, earliestSeen, performanceCount };
    })
    .filter(
      (s) =>
        s.earliestSeen !== Infinity &&
        s.earliestSeen >= cutoff &&
        s.performanceCount > 0,
    )
    .sort((a, b) => b.earliestSeen - a.earliestSeen)
    .slice(0, limit)
    .map(({ movie, performanceCount }) => ({ movie, performanceCount }));
}

function formatLastShowing(time: number): string {
  const label = new Date(time).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: LONDON_TIMEZONE,
  });
  return `Last showing ${label}`;
}

/**
 * Matched, default-category films whose run is ending: they have at least one
 * upcoming non-sold-out performance, and their final non-sold-out performance is
 * within the next `LAST_CHANCE_DAYS` days. Soonest-ending first. The matched +
 * default-category filter keeps out one-off events with a single performance.
 */
export function getLastChanceMovies(
  movies: MoviesRecord,
  now: number = Date.now(),
  limit: number = DEFAULT_LIMIT,
  excludeIds: Set<string> = new Set(),
): ScoredMovie[] {
  const deadline = now + LAST_CHANCE_DAYS * MS_PER_DAY;

  return Object.values(movies)
    .filter(
      (movie) =>
        isDiscoverable(movie) && isMatched(movie) && !excludeIds.has(movie.id),
    )
    .map((movie) => {
      const upcoming = movie.performances.filter(
        (p) => p.time >= now && !p.status?.soldOut,
      );
      const finalTime = upcoming.reduce((max, p) => Math.max(max, p.time), 0);
      return { movie, performanceCount: upcoming.length, finalTime };
    })
    .filter((s) => s.performanceCount > 0 && s.finalTime <= deadline)
    .sort((a, b) => a.finalTime - b.finalTime)
    .slice(0, limit)
    .map(({ movie, performanceCount, finalTime }) => ({
      movie,
      performanceCount,
      subtitle: formatLastShowing(finalTime),
    }));
}

function isMarathon(movie: Movie): boolean {
  return (
    (movie.includedMovies?.length ?? 0) > 1 ||
    getPrimaryCategory(movie) === Category.MultipleMovies
  );
}

/**
 * Multi-film events (double bills, marathons, all-nighters) with upcoming
 * performances. Sorted by how widely they're showing. Subtitle is the number of
 * films when known.
 */
export function getMarathonMovies(
  movies: MoviesRecord,
  window: DiscoveryWindow = getDiscoveryWindow(),
  limit: number = DEFAULT_LIMIT,
  excludeIds: Set<string> = new Set(),
): ScoredMovie[] {
  return Object.values(movies)
    .filter((movie) => isMarathon(movie) && !excludeIds.has(movie.id))
    .map((movie) => {
      const upcoming = upcomingPerformances(movie, window);
      const venueIds = new Set<string>();
      for (const performance of upcoming) {
        const venueId = movie.showings[performance.showingId]?.venueId;
        if (venueId) venueIds.add(venueId);
      }
      return {
        movie,
        performanceCount: upcoming.length,
        venueCount: venueIds.size,
        filmCount: movie.includedMovies?.length ?? 0,
      };
    })
    .filter((s) => s.performanceCount > 0)
    .sort(
      (a, b) =>
        b.venueCount * VENUE_WEIGHT +
        b.performanceCount -
        (a.venueCount * VENUE_WEIGHT + a.performanceCount),
    )
    .slice(0, limit)
    .map(({ movie, performanceCount, filmCount }) => ({
      movie,
      performanceCount,
      subtitle: filmCount > 1 ? `${filmCount} films` : undefined,
    }));
}

/**
 * Critics' picks: matched films showing this week with a genuinely strong rating
 * (above CRITICS_PICK_MIN_RATING and backed by enough reviews). Permanent
 * attractions are excluded. Best-rated first; the subtitle is the rating itself.
 */
export function getCriticsPicks(
  movies: MoviesRecord,
  window: DiscoveryWindow = getDiscoveryWindow(),
  limit: number = DEFAULT_LIMIT,
  now: number = Date.now(),
): ScoredMovie[] {
  return Object.values(movies)
    .filter(
      (movie) =>
        isDiscoverable(movie) && isMatched(movie) && !isEvergreen(movie, now),
    )
    .map((movie) => ({
      movie,
      rating: getRating(movie),
      performanceCount: upcomingPerformances(movie, window).length,
    }))
    .filter(
      (s): s is { movie: Movie; rating: Rating; performanceCount: number } =>
        s.rating !== null &&
        s.rating.norm >= CRITICS_PICK_MIN_RATING &&
        s.performanceCount > 0,
    )
    .sort((a, b) => b.rating.norm - a.rating.norm)
    .slice(0, limit)
    .map(({ movie, rating, performanceCount }) => ({
      movie,
      performanceCount,
      subtitle: rating.text,
    }));
}

/**
 * Computes every discovery row in one pass. Run at build time for the SSR
 * fallback (window anchored to today's midnight, matching the rest of the site's
 * SSR) and again on the client with `anchorToNow` so the window starts at the
 * current moment — dropping showings that have already finished today, exactly
 * as the movie pages hide them.
 */
export function computeDiscoveryRows(
  movies: MoviesRecord,
  options: { now?: number; anchorToNow?: boolean } = {},
): DiscoveryRows {
  const now = options.now ?? Date.now();
  const window = getDiscoveryWindow(
    7,
    options.anchorToNow ? now : getLondonMidnightTimestamp(),
  );
  return {
    popular: getPopularMovies(movies, window, POPULAR_LIMIT),
    criticsPicks: getCriticsPicks(movies, window, CRITICS_LIMIT, now),
    newAdditions: getNewAdditions(
      movies,
      window,
      now,
      new Set(),
      NEW_ADDITIONS_LIMIT,
    ),
    lastChance: getLastChanceMovies(movies, now, LAST_CHANCE_LIMIT),
    // Uncapped — the full marathon/double-bill set is small and inherently special.
    marathons: getMarathonMovies(movies, window, Infinity),
  };
}
