import type { Movie, MoviePerformance, Position } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import type { NearMeFilmClub, NearMeVenue } from "@/utils/get-near-me-data";
import {
  DEFAULT_CATEGORIES,
  getPrimaryCategory,
} from "@/lib/filters/modules/categories";
import {
  getDistanceInMiles,
  NEARBY_MAX_RADIUS_MILES,
} from "@/utils/geo-distance";
import { MS_PER_DAY } from "@/utils/format-date";

/**
 * A venue has to have *more* than this many screenings in the next
 * {@link LOCAL_WINDOW_DAYS} days to count as a local. The point is somewhere you
 * could turn up this week and find something on — a pub that runs one film a
 * month is near you, but it isn't your local.
 */
export const LOCAL_MIN_SCREENINGS = 5;

/**
 * A week rather than today, so a local doesn't drop off on a quiet Monday.
 */
export const LOCAL_WINDOW_DAYS = 7;

/** How many locals are always shown, when that many qualify. */
export const LOCAL_COUNT = 2;

/**
 * One more local is shown if it is within this distance: a third cinema a few
 * minutes' walk away is as much your local as the first two.
 */
export const LOCAL_EXTRA_RADIUS_MILES = 0.5;

/** How many upcoming screenings each local lists. */
export const LOCAL_NEXT_SCREENINGS = 5;

const DISCOVERABLE_CATEGORIES = new Set(DEFAULT_CATEGORIES);

export interface LocalScreening {
  movie: Movie;
  performance: MoviePerformance;
}

export interface LocalVenue {
  venue: NearMeVenue;
  /** Miles from the reader. */
  distance: number;
  /** Bookable screenings in the next {@link LOCAL_WINDOW_DAYS} days. */
  weekScreeningCount: number;
  /** The next {@link LOCAL_NEXT_SCREENINGS} bookable screenings, soonest first. */
  nextScreenings: LocalScreening[];
  /** Film clubs with current screenings at this venue. */
  filmClubs: NearMeFilmClub[];
}

/**
 * The reader's locals: the closest {@link LOCAL_COUNT} venues within
 * {@link NEARBY_MAX_RADIUS_MILES} that have more than
 * {@link LOCAL_MIN_SCREENINGS} screenings in the coming week, plus one more if
 * it is within {@link LOCAL_EXTRA_RADIUS_MILES}.
 *
 * "Screenings" means the categories the films grid shows by default (films,
 * shorts, multi-film events) — the same set the "What's on near me today" link
 * opens on, so a local's count agrees with what that link shows. Screenings that
 * have already started are gone, and sold-out ones are left out: both would
 * list something the reader cannot go to.
 */
export function getLocalVenues(
  position: Position,
  venues: NearMeVenue[],
  movies: MoviesRecord,
  filmClubs: NearMeFilmClub[],
  now: number = Date.now(),
): LocalVenue[] {
  const candidates = venues
    .map((venue) => ({
      venue,
      distance: getDistanceInMiles(position, {
        lat: venue.lat,
        lon: venue.lon,
      }),
    }))
    .filter(({ distance }) => distance <= NEARBY_MAX_RADIUS_MILES);
  if (candidates.length === 0) return [];

  const candidateIds = new Set(candidates.map(({ venue }) => venue.id));
  const screeningsByVenue = new Map<string, LocalScreening[]>();

  for (const movie of Object.values(movies)) {
    if (!DISCOVERABLE_CATEGORIES.has(getPrimaryCategory(movie))) continue;
    for (const performance of movie.performances) {
      if (performance.time < now || performance.status?.soldOut) continue;
      const venueId = movie.showings[performance.showingId]?.venueId;
      if (!venueId || !candidateIds.has(venueId)) continue;
      if (!screeningsByVenue.has(venueId)) screeningsByVenue.set(venueId, []);
      screeningsByVenue.get(venueId)!.push({ movie, performance });
    }
  }

  const weekEnd = now + LOCAL_WINDOW_DAYS * MS_PER_DAY;
  const qualifying = candidates
    .map(({ venue, distance }) => {
      const screenings = (screeningsByVenue.get(venue.id) ?? []).sort(
        (a, b) => a.performance.time - b.performance.time,
      );
      return {
        venue,
        distance,
        screenings,
        weekScreeningCount: screenings.filter(
          ({ performance }) => performance.time < weekEnd,
        ).length,
      };
    })
    .filter(
      ({ weekScreeningCount }) => weekScreeningCount > LOCAL_MIN_SCREENINGS,
    )
    .sort((a, b) => a.distance - b.distance);

  const locals = qualifying.slice(0, LOCAL_COUNT);
  const extra = qualifying[LOCAL_COUNT];
  if (extra && extra.distance <= LOCAL_EXTRA_RADIUS_MILES) locals.push(extra);

  return locals.map(({ venue, distance, screenings, weekScreeningCount }) => ({
    venue,
    distance,
    weekScreeningCount,
    nextScreenings: screenings.slice(0, LOCAL_NEXT_SCREENINGS),
    filmClubs: filmClubs.filter(
      (club) => club.movieCount > 0 && club.venueIds.includes(venue.id),
    ),
  }));
}
