import type { Movie, MoviePerformance } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import { findOccasions, type Occasion } from "@/lib/occasions";
import {
  getFinalShowing,
  LAST_CHANCE_DAYS,
} from "@/utils/get-discovery-movies";
import { MS_PER_DAY } from "@/utils/format-date";

/** What's worth telling a reader about a film on their watchlist. */
export interface WatchlistHighlight {
  /**
   * The last bookable showing, when it falls inside the home page's Last
   * Chance window — the same definition, so a film can't be ending on one
   * page and not the other.
   */
  finalShowing: MoviePerformance | null;
  /** The film's best bookable occasion — a Q&A, a live score, a premiere. */
  occasion: Occasion | null;
}

/**
 * The occasion pass is over the whole dataset, and the watchlist changes with
 * every removal and undo, so the pass is kept per dataset and "now".
 */
const occasionCache = new WeakMap<
  MoviesRecord,
  { now: number; occasions: Occasion[] }
>();

function getOccasions(movies: MoviesRecord, now: number) {
  const cached = occasionCache.get(movies);
  if (cached?.now === now) return cached.occasions;
  const occasions = findOccasions(movies, { start: now, end: Infinity });
  occasionCache.set(movies, { now, occasions });
  return occasions;
}

/**
 * Ending runs and occasions for the given films.
 *
 * Occasions come from the same scoring as the home page's More Than a
 * Screening row, with no end date: a watchlist is a reason to plan ahead, so a
 * Q&A two months out is as much news as one next week. Scoring is relative to
 * the whole dataset (how routine a signal is at its venue), so it has to run
 * over everything and be filtered afterwards — which is also why a signal the
 * row treats as house style (the Garden's nightly intros) stays unflagged
 * here. Sold-out occasions are skipped, as the row skips them: a night you
 * can't have is no use to a reader.
 */
export function getWatchlistHighlights(
  movies: MoviesRecord,
  movieIds: Movie["id"][],
  now: number = Date.now(),
): Map<Movie["id"], WatchlistHighlight> {
  const highlights = new Map<Movie["id"], WatchlistHighlight>();
  const wanted = new Set(movieIds.filter((id) => movies[id]));
  if (wanted.size === 0) return highlights;

  const deadline = now + LAST_CHANCE_DAYS * MS_PER_DAY;
  for (const id of wanted) {
    const final = getFinalShowing(movies[id], now);
    highlights.set(id, {
      finalShowing: final && final.time <= deadline ? final : null,
      occasion: null,
    });
  }

  // Rarest first, so the first bookable one met for a film is its best.
  for (const occasion of getOccasions(movies, now)) {
    const highlight = highlights.get(occasion.movie.id);
    if (!highlight || highlight.occasion) continue;
    if (occasion.performance.status?.soldOut) continue;
    highlight.occasion = occasion;
  }

  return highlights;
}
