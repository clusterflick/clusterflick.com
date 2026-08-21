import type { Movie, MoviePerformance } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import {
  getPrimaryCategory,
  DEFAULT_CATEGORIES as DEFAULT_CATEGORY_LIST,
} from "@/lib/filters/modules/categories";
import { getRating } from "@/utils/movie-ratings.mjs";
import { matchOccasions, OccasionKind } from "./rules";

export { OccasionKind } from "./rules";
export type { OccasionMatch } from "./rules";

/**
 * A performance that is more than a screening, with the evidence for saying so.
 *
 * Detection ({@link matchOccasions}) is the easy half. The hard half is not
 * crying wolf, which is what the score is for: the same words mean different
 * things at different venues, and "rare" is the whole claim being made.
 */
export interface Occasion {
  movie: Movie;
  performance: MoviePerformance;
  venueId: string;
  kind: OccasionKind;
  label: string;
  /** Higher is rarer. Only meaningful relative to other occasions. */
  score: number;
  /** Upcoming performances of this film anywhere in London. */
  filmPerformanceCount: number;
}

/** How much each kind is worth before scarcity is taken into account. */
const KIND_WEIGHT: Record<OccasionKind, number> = {
  [OccasionKind.LiveScore]: 1,
  [OccasionKind.Guest]: 0.9,
  [OccasionKind.Premiere]: 0.6,
  [OccasionKind.Intro]: 0.4,
  [OccasionKind.Preview]: 0.3,
};

/** Naming the guest is the strongest evidence that a screening is a one-off. */
const NAMED_BONUS = 0.1;

/**
 * A signal that recurs across a venue's programme is house style, not an
 * occasion — The Garden Cinema introduces 21% of its screenings and the ICA
 * calls 28% of its programme a premiere. Above this share the kind is dropped
 * at that venue entirely.
 */
const MAX_VENUE_SHARE = 0.15;

/**
 * …but the share is only meaningful with something to divide by. A church hall
 * with two screenings a year, one of them introduced, is at 50% and is exactly
 * what we want to surface. Below this many upcoming performances a venue is
 * judged on nothing but the words.
 */
const MIN_VENUE_SAMPLE = 20;

/** At or below this many upcoming screenings, the venue is itself the event. */
const RARE_VENUE_MAX = 4;
const RARE_VENUE_BONUS = 1.2;

/**
 * Kinds where a film screening rarely makes the occasion rarer, and kinds
 * where it makes it *less* interesting.
 *
 * A Q&A for a film showing once is a last chance; a Q&A for a film showing
 * thirty times is a Tuesday. Premieres invert it: a premiere that never
 * returns is a hire, of interest to the people already coming, while a
 * premiere of something with a run behind it is a first look at a film readers
 * will hear about again.
 */
const SCARCITY_FAVOURS_RARE = new Set([
  OccasionKind.LiveScore,
  OccasionKind.Guest,
  OccasionKind.Intro,
]);

/**
 * How much a film's own scarcity is allowed to move each kind.
 *
 * A live score is unrepeatable on its own terms — the band is there that night
 * and not the next — so how often the film screens is nearly beside the point,
 * and left at full strength it buried a live-scored This Is England beneath
 * every one-off Q&A in the city. A bare introduction has no such standing: if
 * the film is everywhere, the intro is all it has.
 */
const SCARCITY_SENSITIVITY: Record<OccasionKind, number> = {
  [OccasionKind.LiveScore]: 0.3,
  [OccasionKind.Guest]: 1,
  [OccasionKind.Premiere]: 1,
  [OccasionKind.Intro]: 1,
  [OccasionKind.Preview]: 1,
};

function filmScarcityFactor(kind: OccasionKind, upcoming: number): number {
  let raw: number;
  if (SCARCITY_FAVOURS_RARE.has(kind)) {
    if (upcoming <= 2) raw = 1;
    else if (upcoming <= 4) raw = 0.9;
    else if (upcoming <= 8) raw = 0.75;
    else raw = 0.55;
  } else if (upcoming <= 1) raw = 0.35;
  else if (upcoming <= 3) raw = 0.7;
  else raw = 1;

  return 1 - SCARCITY_SENSITIVITY[kind] * (1 - raw);
}

/**
 * A film needs this many showings before "only some of them" means anything.
 */
const MIN_ALTERNATIVES = 4;
/** Above this share of a film's showings, the occasion is how the film screens. */
const MAX_DISTINCTIVE_RATIO = 0.5;
/** Full strength when a film screens widely and one showing is the odd one out. */
const DISTINCTIVENESS_BONUS = 0.3;

/**
 * How much this showing stands out from the film's other showings.
 *
 * The counts elsewhere ask how rare the *film* is; this asks how rare the
 * *night* is among the alternatives a reader actually has. One Q&A among sixty
 * showings of a film in general release is a genuinely different evening —
 * every other way to see that film is available and this one is not.
 *
 * It is a bonus and never a penalty, which is deliberate. Turning a 1:1 ratio
 * into a deduction reads well in theory and empties the row in practice: a
 * repertory classic showing once with a guest is also 1:1, and scoring it down
 * traded an intro of Dr. Who and the Daleks by its biographer for an advance
 * preview of a new release. What separates those two is the film, which is
 * {@link notabilityFactor}'s job, not this one's.
 */
function distinctivenessFactor(occasionCount: number, total: number): number {
  if (total < MIN_ALTERNATIVES) return 1;
  const ratio = occasionCount / total;
  if (ratio > MAX_DISTINCTIVE_RATIO) return 1;
  return 1 + DISTINCTIVENESS_BONUS * (1 - ratio);
}

/** Films this old are out of release: a guest for one was arranged, not booked. */
const REPERTORY_MIN_AGE_YEARS = 15;
const REPERTORY_BONUS = 1.15;
/** Within this of release, a film is still in its first run. */
const NEW_RELEASE_MAX_AGE_DAYS = 365;
/** A brand-new film nobody has reviewed yet is an unknown, not an event. */
const UNKNOWN_NEWCOMER_FACTOR = 0.6;
const YEAR_MS = 365.25 * 86_400_000;

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
 * Whether the film is worth crossing London for, independent of the occasion.
 *
 * Without this the row fills with the same thing every fortnight: a single
 * screening of a documentary nobody has heard of, with its director in the
 * room. Those are real events for the people already going, and they are
 * indistinguishable by scarcity alone from a repertory classic with a guest —
 * both show exactly once. What separates them is the film. An out-of-release
 * film with a guest had to be programmed; a first-run film with no reviews yet
 * is an unknown quantity, so it is damped rather than dropped.
 */
function notabilityFactor(movie: Movie, now: number): number {
  const releaseTime = getReleaseTime(movie);
  if (releaseTime === null) return 1;

  const age = now - releaseTime;
  if (age >= REPERTORY_MIN_AGE_YEARS * YEAR_MS) return REPERTORY_BONUS;
  if (age <= NEW_RELEASE_MAX_AGE_DAYS * 86_400_000 && !getRating(movie)) {
    return UNKNOWN_NEWCOMER_FACTOR;
  }
  return 1;
}

// Categories shown by default on the films grid, as the other discovery rows use.
const DEFAULT_CATEGORIES = new Set(DEFAULT_CATEGORY_LIST);

/** Films the discovery rows treat as films (excludes quizzes, workshops, …). */
function isDiscoverable(movie: Movie): boolean {
  return DEFAULT_CATEGORIES.has(getPrimaryCategory(movie));
}

/**
 * Everything a venue wrote about one performance, as one haystack — empty when
 * it wrote nothing beyond the film's own title, which is most of them.
 *
 * The newline matters: the two fields are separate sentences, and a name
 * capture must not run from the end of one into the start of the other.
 */
function occasionText(movie: Movie, performance: MoviePerformance): string {
  const title = movie.showings[performance.showingId]?.title;
  if (!title && !performance.notes) return "";
  return `${title ?? ""} \n ${performance.notes ?? ""}`;
}

export interface OccasionWindow {
  /** Performances from here on count towards a venue's profile. */
  start: number;
  /** Occasions are only returned up to here. */
  end: number;
  /** "Now", for judging a film's age. Defaults to `start`. */
  now?: number;
}

/**
 * Every occasion in the window, rarest first.
 *
 * Runs in one pass over the whole dataset, because the scoring is relative:
 * how routine a signal is at its venue, and how often its film screens
 * elsewhere, can only be known by looking at everything. The venue profile is
 * built from all upcoming performances rather than just the window — house
 * style doesn't change week to week, and a fortnight is a thin sample.
 *
 * Cheap enough to run on the client (it's a regex pass over ~30k strings), so
 * the home row can be recomputed after hydration like every other one.
 */
export function findOccasions(
  movies: MoviesRecord,
  { start, end, now = start }: OccasionWindow,
): Occasion[] {
  type Candidate = {
    movie: Movie;
    performance: MoviePerformance;
    venueId: string;
    kind: OccasionKind;
    label: string;
    named: boolean;
  };

  const candidates: Candidate[] = [];
  const venueTotals = new Map<string, number>();
  const venueKindTotals = new Map<string, number>();
  const filmCounts = new Map<string, number>();
  const filmKindTotals = new Map<string, number>();

  for (const movie of Object.values(movies)) {
    if (!isDiscoverable(movie)) continue;

    let upcomingCount = 0;
    for (const performance of movie.performances) {
      if (performance.time < start) continue;
      upcomingCount++;

      const venueId = movie.showings[performance.showingId]?.venueId;
      if (!venueId) continue;
      venueTotals.set(venueId, (venueTotals.get(venueId) ?? 0) + 1);

      const matches = matchOccasions(occasionText(movie, performance));
      if (matches.length === 0) continue;

      for (const match of matches) {
        const venueKey = `${venueId}|${match.kind}`;
        venueKindTotals.set(venueKey, (venueKindTotals.get(venueKey) ?? 0) + 1);
        const filmKey = `${movie.id}|${match.kind}`;
        filmKindTotals.set(filmKey, (filmKindTotals.get(filmKey) ?? 0) + 1);
      }

      // Only the most specific kind is offered — a screening with a live score
      // and an intro is a live score, and a poster subtitle has room for one
      // thing.
      if (performance.time < end) {
        const [best] = matches;
        candidates.push({
          movie,
          performance,
          venueId,
          kind: best.kind,
          label: best.label,
          named: best.named,
        });
      }
    }
    filmCounts.set(movie.id, upcomingCount);
  }

  const occasions: Occasion[] = [];
  for (const candidate of candidates) {
    const venueTotal = venueTotals.get(candidate.venueId) ?? 0;
    const kindTotal =
      venueKindTotals.get(`${candidate.venueId}|${candidate.kind}`) ?? 0;
    const share = venueTotal > 0 ? kindTotal / venueTotal : 0;

    if (venueTotal >= MIN_VENUE_SAMPLE && share > MAX_VENUE_SHARE) continue;

    const filmPerformanceCount = filmCounts.get(candidate.movie.id) ?? 0;
    const weight =
      KIND_WEIGHT[candidate.kind] + (candidate.named ? NAMED_BONUS : 0);
    const sameKindAtFilm =
      filmKindTotals.get(`${candidate.movie.id}|${candidate.kind}`) ?? 1;
    const score =
      weight *
      filmScarcityFactor(candidate.kind, filmPerformanceCount) *
      distinctivenessFactor(sameKindAtFilm, filmPerformanceCount) *
      notabilityFactor(candidate.movie, now) *
      (1 - share) *
      (venueTotal <= RARE_VENUE_MAX ? RARE_VENUE_BONUS : 1);

    occasions.push({
      movie: candidate.movie,
      performance: candidate.performance,
      venueId: candidate.venueId,
      kind: candidate.kind,
      label: candidate.label,
      score,
      filmPerformanceCount,
    });
  }

  return occasions.sort(
    (a, b) => b.score - a.score || a.performance.time - b.performance.time,
  );
}

/**
 * What each occasion already taken from a venue costs the next one from the
 * same venue.
 *
 * A hard cap was the first attempt and it was wrong: capping BFI Southbank at
 * three dropped a Q&A with Hayley Mills and one with Mike Leigh, both scoring
 * 0.98, to make room for entries at 0.83. Crowding is a reason to prefer
 * variety between close calls, not a reason to throw away the best thing on
 * offer, so it is priced rather than forbidden — a fourth entry from one venue
 * has to be about 15% better than the alternative to keep its place.
 */
const CROWDING_DECAY = 0.95;

/**
 * The best bookable occasion per film, rarest first, with no venue allowed to
 * take over.
 *
 * Sold-out performances are left out, because the whole claim being made is
 * that this is a night you cannot have another way — which is no use to a
 * reader who cannot have this one either. They are worth excluding despite
 * only fifteen venues reporting availability at all: an occasion is roughly
 * ten times likelier to be sold out than an ordinary performance, and the
 * highest-scoring ones likelier still, so the few venues that do report are
 * disproportionately the ones filling this list. A film keeps its place if any
 * of its occasion performances is still available; `findOccasions` reports
 * them all, sold out or not.
 *
 * A film appears once because the row is a row of posters, and a season of
 * Q&As with the same film would otherwise fill it on its own.
 *
 * Venues are handled by selecting greedily against a running discount rather
 * than by filtering: at each step the pick is whichever occasion scores
 * highest after {@link CROWDING_DECAY} is applied once per entry already taken
 * from its venue. A venue running an outstanding season keeps its places; one
 * running a merely good one gives them up.
 */
export function findBestOccasionPerMovie(
  movies: MoviesRecord,
  window: OccasionWindow,
  crowdingDecay: number = CROWDING_DECAY,
): Occasion[] {
  const seenMovies = new Set<string>();
  const remaining: Occasion[] = [];
  for (const occasion of findOccasions(movies, window)) {
    if (occasion.performance.status?.soldOut) continue;
    if (seenMovies.has(occasion.movie.id)) continue;
    seenMovies.add(occasion.movie.id);
    remaining.push(occasion);
  }

  const venueCounts = new Map<string, number>();
  const selected: Occasion[] = [];

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (const [index, occasion] of remaining.entries()) {
      const taken = venueCounts.get(occasion.venueId) ?? 0;
      const adjusted = occasion.score * crowdingDecay ** taken;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIndex = index;
      }
    }

    const [chosen] = remaining.splice(bestIndex, 1);
    venueCounts.set(chosen.venueId, (venueCounts.get(chosen.venueId) ?? 0) + 1);
    selected.push(chosen);
  }

  return selected;
}
