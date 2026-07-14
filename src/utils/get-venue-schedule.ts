import type { Movie, MoviePerformance } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";

/**
 * A single performance in the venue schedule board, kept alongside its movie so
 * the board can build the film link and read the film's poster/title.
 */
export interface VenueScheduleEntry {
  movie: Movie;
  performance: MoviePerformance;
}

/**
 * One day-group of the venue schedule board — the "Today" / "Tomorrow" lobby
 * board. `date` is that day's London midnight timestamp (for the date label);
 * `entries` are the day's performances at the venue, sorted by start time.
 */
export interface VenueScheduleDay {
  label: string;
  date: number;
  entries: VenueScheduleEntry[];
}

/**
 * The next-48-hours schedule for a single venue: today and tomorrow (London
 * time), each as a time-sorted list of performances at that venue. Both days are
 * always returned (either may be empty) so the board can render a per-day
 * "nothing scheduled" line while still distinguishing today from tomorrow.
 *
 * `todayMidnight` defaults to today's London midnight; it is injectable so tests
 * can pin "now". Day boundaries use {@link MS_PER_DAY} to match the discovery
 * window's convention (see `getDiscoveryWindow`).
 */
export function getVenueSchedule(
  movies: MoviesRecord,
  venueId: string,
  todayMidnight: number = getLondonMidnightTimestamp(),
): VenueScheduleDay[] {
  const tomorrowMidnight = todayMidnight + MS_PER_DAY;
  const rangeEnd = todayMidnight + 2 * MS_PER_DAY;

  const today: VenueScheduleEntry[] = [];
  const tomorrow: VenueScheduleEntry[] = [];

  for (const movie of Object.values(movies)) {
    const venueShowingIds = new Set<string>();
    for (const [showingId, showing] of Object.entries(movie.showings)) {
      if (showing.venueId === venueId) venueShowingIds.add(showingId);
    }
    if (venueShowingIds.size === 0) continue;

    for (const performance of movie.performances) {
      if (!venueShowingIds.has(performance.showingId)) continue;
      if (performance.time < todayMidnight || performance.time >= rangeEnd) {
        continue;
      }
      const bucket = performance.time < tomorrowMidnight ? today : tomorrow;
      bucket.push({ movie, performance });
    }
  }

  today.sort((a, b) => a.performance.time - b.performance.time);
  tomorrow.sort((a, b) => a.performance.time - b.performance.time);

  return [
    { label: "Today", date: todayMidnight, entries: today },
    { label: "Tomorrow", date: tomorrowMidnight, entries: tomorrow },
  ];
}
