import type { Movie, MoviePerformance } from "@/types";
import {
  dateStringToLondonTimestamp,
  getLondonMinutesOfDay,
  timestampToLondonDateString,
} from "@/utils/format-date";

/** A London calendar date, "YYYY-MM-DD". */
export type DateString = string;

export interface PlannerRange {
  first: DateString;
  last: DateString;
}

export interface PlannerRowData {
  movie: Movie;
  /** The day's performances, in time order. */
  performances: MoviePerformance[];
}

/**
 * Move a London date by whole days. Done on the calendar date rather than by
 * adding 24 hours, which lands an hour either side of midnight across a clock
 * change.
 */
export function shiftDate(date: DateString, days: number): DateString {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/** Whether a string is a real "YYYY-MM-DD" date, as read from a URL. */
export function isDateString(value: string | null): value is DateString {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return shiftDate(value, 0) === value;
}

/**
 * The days the planner can step through, from the date-range filter.
 *
 * An open start means today, and an open end means the last day any of the
 * filtered films is showing — without one there is nothing to stop "next" at.
 * Null when nothing is showing at all, so there is no range to step through.
 */
export function getPlannerRange(
  movies: Movie[],
  dateRange: { start: number | null; end: number | null },
  today: DateString,
): PlannerRange | null {
  let latest = -Infinity;
  for (const movie of movies) {
    for (const performance of movie.performances) {
      if (performance.time > latest) latest = performance.time;
    }
  }
  if (latest === -Infinity) return null;

  const first =
    dateRange.start === null
      ? today
      : timestampToLondonDateString(dateRange.start);
  const last =
    dateRange.end === null
      ? timestampToLondonDateString(latest)
      : timestampToLondonDateString(dateRange.end);

  // Stale ranges are discarded by the filter provider, so a start before today
  // can only be an open start's today; still, never step into the past.
  const start = first < today ? today : first;
  return { first: start, last: last < start ? start : last };
}

/** Keep a date inside the range, falling back to its first day. */
export function clampToRange(
  date: DateString | null,
  range: PlannerRange,
): DateString {
  if (!date || date < range.first) return range.first;
  if (date > range.last) return range.last;
  return date;
}

/**
 * One row per film showing on `date`, alphabetical as the catalogue is, each
 * carrying only that day's performances. The movies are expected to be the
 * output of the filter pipeline, so every other filter has already applied.
 */
export function getPlannerRows(
  movies: Movie[],
  date: DateString,
): PlannerRowData[] {
  const start = dateStringToLondonTimestamp(date);
  const end = dateStringToLondonTimestamp(shiftDate(date, 1));

  const rows: PlannerRowData[] = [];
  for (const movie of movies) {
    const performances = movie.performances
      .filter(
        (performance) => performance.time >= start && performance.time < end,
      )
      .sort((a, b) => a.time - b.time);
    if (performances.length > 0) rows.push({ movie, performances });
  }
  return rows.sort((a, b) =>
    a.movie.normalizedTitle.localeCompare(b.movie.normalizedTitle),
  );
}

/**
 * The nearest day after (or before) `date` with anything showing, within the
 * range — for an empty day to offer a way out. Null when there is none.
 */
export function findNearestShowingDay(
  movies: Movie[],
  date: DateString,
  direction: "next" | "previous",
  range: PlannerRange,
): DateString | null {
  const dayStart = dateStringToLondonTimestamp(date);
  const nextDayStart = dateStringToLondonTimestamp(shiftDate(date, 1));

  let best: number | null = null;
  for (const movie of movies) {
    for (const { time } of movie.performances) {
      if (direction === "next") {
        if (time >= nextDayStart && (best === null || time < best)) best = time;
      } else if (time < dayStart && (best === null || time > best)) {
        best = time;
      }
    }
  }
  if (best === null) return null;

  const found = timestampToLondonDateString(best);
  return found >= range.first && found <= range.last ? found : null;
}

/** One performance and the film it belongs to, for lanes that mix films. */
export interface PlannerHourItem {
  movie: Movie;
  performance: MoviePerformance;
}

export type PlannerHourSection =
  | {
      kind: "hour";
      /** London clock hour, 0–23. */
      hour: number;
      items: PlannerHourItem[];
    }
  | {
      /** A run of empty hours between two busy ones, shown as one divider. */
      kind: "gap";
      from: number;
      to: number;
    };

/**
 * The day's performances grouped by the London clock hour they start in, for
 * the by-time view. Within an hour: soonest first, then by title. Empty hours
 * between the first and last busy ones collapse into one `gap` per run, so the
 * page shows where the day has room without a row per empty hour.
 */
export function getPlannerHours(
  movies: Movie[],
  date: DateString,
): PlannerHourSection[] {
  const start = dateStringToLondonTimestamp(date);
  const end = dateStringToLondonTimestamp(shiftDate(date, 1));

  const byHour = new Map<number, PlannerHourItem[]>();
  for (const movie of movies) {
    for (const performance of movie.performances) {
      if (performance.time < start || performance.time >= end) continue;
      const hour = Math.floor(getLondonMinutesOfDay(performance.time) / 60);
      const items = byHour.get(hour);
      if (items) items.push({ movie, performance });
      else byHour.set(hour, [{ movie, performance }]);
    }
  }
  if (byHour.size === 0) return [];

  const hours = [...byHour.keys()].sort((a, b) => a - b);
  const sections: PlannerHourSection[] = [];
  for (const [index, hour] of hours.entries()) {
    const previous = hours[index - 1];
    if (previous !== undefined && hour - previous > 1) {
      sections.push({ kind: "gap", from: previous + 1, to: hour - 1 });
    }
    const items = byHour
      .get(hour)!
      .sort(
        (a, b) =>
          a.performance.time - b.performance.time ||
          a.movie.normalizedTitle.localeCompare(b.movie.normalizedTitle),
      );
    sections.push({ kind: "hour", hour, items });
  }
  return sections;
}

type Groupable = { movie: { id: string }; performance: { time: number } };

/** Performances of one film starting at one moment: the first, and the rest. */
export interface PlannerTimeGroup<T extends Groupable> {
  /** Film and start time, stable across renders. */
  key: string;
  first: T;
  rest: T[];
}

/**
 * Collapse performances of the same film starting at the same moment into one
 * entry, in the order each first appears. A wide release is otherwise a run of
 * identical cards differing only by venue. Only an exact start time groups —
 * an 18:45 showing stays its own card rather than hiding behind an 18:00 one.
 * Measured on a September release, the busiest unfiltered hour goes from 339
 * performances to about 145 entries.
 */
export function groupBySameStart<T extends Groupable>(
  items: T[],
): PlannerTimeGroup<T>[] {
  const groups = new Map<string, PlannerTimeGroup<T>>();
  for (const item of items) {
    const key = `${item.movie.id}@${item.performance.time}`;
    const group = groups.get(key);
    if (group) group.rest.push(item);
    else groups.set(key, { key, first: item, rest: [] });
  }
  return [...groups.values()];
}

/** A London clock hour as "19:00". */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
