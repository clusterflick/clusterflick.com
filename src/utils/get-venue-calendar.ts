import { readFileSync } from "fs";
import { join } from "path";

interface PublishedDataIndex {
  venues: Record<string, { data?: string; calendar?: string }>;
}

let index: PublishedDataIndex | null = null;

/**
 * Reads the index written by scripts/fetch-published-data.js. A missing index
 * is not an error — the fetch step is skipped in some environments (Storybook,
 * a checkout that has not run the data scripts), and every calendar page
 * degrades to its empty state rather than failing the build.
 */
function getIndex(): PublishedDataIndex {
  if (index) return index;

  const indexPath = join(process.cwd(), "public", "data", "index.json");

  try {
    index = JSON.parse(readFileSync(indexPath, "utf-8"));
  } catch {
    index = { venues: {} };
  }

  return index!;
}

/**
 * Site-relative URL of a venue's published ICS feed — the same file a
 * subscriber reads (see `VenueHeroDetails`). Returns null when the venue has no
 * published calendar.
 */
export function getVenueCalendarPath(venueId: string): string | null {
  return getIndex().venues[venueId]?.calendar ?? null;
}
