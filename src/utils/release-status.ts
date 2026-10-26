/**
 * The release history of the two published datasets, as the data status page
 * (/datasets/status/) shows it. Pure, so the page can summarise the log at
 * build time and the browser can redo the date-dependent parts against today:
 * a page built days ago must not go on saying the latest release was today.
 *
 * Days are London days, because that's the day a release's tag names and the
 * day the people reading this live in.
 */

import {
  getLondonMinutesOfDay,
  timestampToLondonDateString,
} from "@/utils/format-date";

export type DatasetKey = "data" | "calendar";

/** One row of clusterflick/data-analysed's release log */
export interface ReleaseLogRow {
  dataset: DatasetKey;
  repository: string;
  tag: string;
  publishedAt: string;
}

export interface ReleaseRef {
  tag: string;
  publishedAt: string;
}

export interface DatasetHistory {
  key: DatasetKey;
  label: string;
  repository: string;
  first: ReleaseRef;
  latest: ReleaseRef;
  total: number;
  /** Releases per London day (YYYY-MM-DD), days with none left out */
  days: Record<string, number>;
}

export interface TimeOfDay {
  /** How many days back the distribution covers */
  windowDays: number;
  /** The dataset it is drawn from */
  dataset: DatasetKey;
  /** Releases in each London hour of the day, 0–23 */
  hours: number[];
  releases: number;
  /** Minutes past midnight, London: the day's first release, median and 90th percentile */
  firstOfDay: { median: number; p90: number } | null;
  /** Median minutes from a data release to the calendar release built from it */
  calendarLag: number | null;
}

export interface ReleaseStatus {
  builtAt: string;
  datasets: DatasetHistory[];
  timeOfDay: TimeOfDay;
}

/** Past this, the page says the data has stopped updating rather than look healthy. */
export const STALE_AFTER_HOURS = 36;
export const RECENT_DAYS = 90;

export const DATASET_LABELS: Record<DatasetKey, string> = {
  data: "Data files",
  calendar: "Calendar feeds",
};

function getLondonParts(date: Date) {
  return {
    day: timestampToLondonDateString(date.getTime()),
    minutes: getLondonMinutesOfDay(date.getTime()),
  };
}

/** The London day a moment falls on, as YYYY-MM-DD */
export function getLondonDay(date: Date): string {
  return timestampToLondonDateString(date.getTime());
}

/** A day key moved by whole days. Day keys carry no time, so UTC arithmetic is exact. */
export function addDays(day: string, count: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/** The last `count` days up to and including `today`, oldest first, with their release counts. */
export function getRecentDays(
  days: Record<string, number>,
  today: string,
  count: number = RECENT_DAYS,
): Array<{ day: string; releases: number }> {
  return Array.from({ length: count }, (_, index) => {
    const day = addDays(today, index - count + 1);
    return { day, releases: days[day] ?? 0 };
  });
}

/**
 * Runs of consecutive days with at least one release. The current run may end
 * yesterday: today's first release is often still hours away, and a streak
 * shouldn't read as broken every morning until it lands.
 */
export function getStreaks(
  days: Record<string, number>,
  today: string,
): { current: number; longest: number } {
  const sorted = Object.keys(days)
    .filter((day) => days[day] > 0)
    .sort();

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of sorted) {
    run = previous && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  let current = 0;
  let day = days[today] ? today : addDays(today, -1);
  while (days[day]) {
    current += 1;
    day = addDays(day, -1);
  }

  return { current, longest };
}

/**
 * The fewest and the median releases a day over the last `count` whole days.
 * Today is left out, being unfinished.
 */
export function getDailyRange(
  days: Record<string, number>,
  today: string,
  count: number = RECENT_DAYS,
): { fewest: number; median: number } {
  const counts = getRecentDays(days, addDays(today, -1), count)
    .map(({ releases }) => releases)
    .sort((a, b) => a - b);
  return { fewest: counts[0], median: median(counts) };
}

/** Whole hours since a moment, never negative */
export function getHoursSince(publishedAt: string, now: Date): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(publishedAt).getTime()) / 3_600_000),
  );
}

function median(sorted: number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function percentile(sorted: number[], fraction: number): number {
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)
  ];
}

/**
 * When in the day releases land, over the last `windowDays`: the data files,
 * since the calendar feeds are built from each data release and follow it by a
 * few minutes (given as `calendarLag` instead of as a second, near-identical
 * series).
 */
export function getTimeOfDay(
  rows: ReleaseLogRow[],
  now: Date,
  windowDays: number = RECENT_DAYS,
): TimeOfDay {
  const since = addDays(getLondonDay(now), -windowDays + 1);
  const recent = rows
    .map((row) => ({ row, ...getLondonParts(new Date(row.publishedAt)) }))
    .filter(({ day }) => day >= since);
  const data = recent.filter(({ row }) => row.dataset === "data");

  const hours = Array.from({ length: 24 }, () => 0);
  const firstByDay = new Map<string, number>();
  for (const { day, minutes } of data) {
    hours[Math.floor(minutes / 60)] += 1;
    firstByDay.set(day, Math.min(firstByDay.get(day) ?? Infinity, minutes));
  }
  const firsts = [...firstByDay.values()].sort((a, b) => a - b);

  // Each calendar release against the data release before it
  const dataTimes = data
    .map(({ row }) => new Date(row.publishedAt).getTime())
    .sort((a, b) => a - b);
  const lags: number[] = [];
  for (const { row } of recent) {
    if (row.dataset !== "calendar") continue;
    const time = new Date(row.publishedAt).getTime();
    const before = dataTimes.filter((dataTime) => dataTime <= time).at(-1);
    if (before !== undefined) lags.push((time - before) / 60_000);
  }
  lags.sort((a, b) => a - b);

  return {
    windowDays,
    dataset: "data",
    hours,
    releases: data.length,
    firstOfDay: firsts.length
      ? { median: median(firsts), p90: percentile(firsts, 0.9) }
      : null,
    calendarLag: lags.length ? Math.round(median(lags)) : null,
  };
}

/**
 * Folds the release log into what the status page shows. `current` is the
 * releases the site was just built from (index.json's): the log is dispatched
 * at the same moment as the build, so it can be a release behind the data the
 * site is serving, and the page shouldn't be.
 */
export function summariseReleases(
  rows: ReleaseLogRow[],
  current: Partial<Record<DatasetKey, ReleaseLogRow | null>>,
  now: Date,
): ReleaseStatus {
  const all = [...rows];
  for (const row of Object.values(current)) {
    if (
      row &&
      !all.some(
        (logged) => logged.dataset === row.dataset && logged.tag === row.tag,
      )
    ) {
      all.push(row);
    }
  }
  all.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

  const datasets = (Object.keys(DATASET_LABELS) as DatasetKey[]).map((key) => {
    const releases = all.filter((row) => row.dataset === key);
    if (releases.length === 0) {
      throw new Error(`The release log has no releases of ${key}`);
    }
    const days: Record<string, number> = {};
    for (const { publishedAt } of releases) {
      const day = getLondonDay(new Date(publishedAt));
      days[day] = (days[day] ?? 0) + 1;
    }
    const ref = ({ tag, publishedAt }: ReleaseLogRow) => ({ tag, publishedAt });
    return {
      key,
      label: DATASET_LABELS[key],
      repository: releases[0].repository,
      first: ref(releases[0]),
      latest: ref(releases[releases.length - 1]),
      total: releases.length,
      days,
    };
  });

  return {
    builtAt: now.toISOString(),
    datasets,
    timeOfDay: getTimeOfDay(all, now),
  };
}
