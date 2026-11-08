import {
  summariseReleases,
  type ReleaseLogRow,
  type ReleaseStatus,
} from "@/utils/release-status";

/** The moment the story pages are drawn as of */
export const STORY_NOW = "2026-10-26T12:00:00Z";

const DAY_MS = 86_400_000;

/**
 * A release log shaped like the real one: a release most mornings around
 * 05:00–07:00 UTC, more through the afternoon and evening, the calendar feed
 * ten minutes behind each data release, and a week's gap early on. Seeded, so
 * the stories (and Chromatic's snapshots of them) are the same every run.
 */
function buildRows(days: number, end: Date): ReleaseLogRow[] {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const rows: ReleaseLogRow[] = [];
  for (let day = days; day >= 0; day -= 1) {
    const midnight = new Date(end.getTime() - day * DAY_MS);
    midnight.setUTCHours(0, 0, 0, 0);
    // The gap: a week without releases, three weeks in
    if (day < days - 6 && day > days - 14) continue;

    const times = [5 * 60 + random() * 90];
    if (random() > 0.3) times.push(16 * 60 + random() * 240);
    if (random() > 0.6) times.push(10 * 60 + random() * 120);
    for (const minutes of times) {
      const published = new Date(midnight.getTime() + minutes * 60_000);
      if (published > end) continue;
      const calendar = new Date(published.getTime() + 10 * 60_000);
      const tag = (date: Date) =>
        date.toISOString().replace(/[-:]/g, "").replace("T", ".").slice(0, 15);
      rows.push({
        dataset: "data",
        repository: "clusterflick/data-transformed",
        tag: tag(published),
        publishedAt: published.toISOString().replace(/\.\d+Z$/, "Z"),
      });
      rows.push({
        dataset: "calendar",
        repository: "clusterflick/data-calendar",
        tag: tag(calendar),
        publishedAt: calendar.toISOString().replace(/\.\d+Z$/, "Z"),
      });
    }
  }
  return rows.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
}

/** Release status as the pages see it, `days` of history ending at `now` */
export function getStoryReleaseStatus(
  now: string = STORY_NOW,
  days = 625,
): ReleaseStatus {
  return summariseReleases(buildRows(days, new Date(now)), {}, new Date(now));
}
