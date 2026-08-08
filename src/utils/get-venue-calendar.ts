import { readFileSync } from "fs";
import { join } from "path";

interface CalendarManifest {
  tag: string | null;
  files: Record<string, string>;
}

let manifest: CalendarManifest | null = null;

/**
 * Reads the manifest written by scripts/fetch-calendar-data.js. A missing
 * manifest is not an error — the fetch step is skipped in some environments
 * (Storybook, a checkout that has not run the data scripts), and every calendar
 * page degrades to its empty state rather than failing the build.
 */
function getManifest(): CalendarManifest {
  if (manifest) return manifest;

  const manifestPath = join(
    process.cwd(),
    "public",
    "calendars",
    "manifest.json",
  );

  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    manifest = { tag: null, files: {} };
  }

  return manifest!;
}

/**
 * Site-relative URL of a venue's ICS feed, content-hashed so it can be cached
 * indefinitely. Returns null when the venue has no published calendar.
 */
export function getVenueCalendarPath(venueId: string): string | null {
  const filename = getManifest().files[venueId];
  return filename ? `/calendars/${filename}` : null;
}

/** Release tag the calendars were built from, for "last updated" copy. */
export function getCalendarReleaseTag(): string | null {
  return getManifest().tag;
}
