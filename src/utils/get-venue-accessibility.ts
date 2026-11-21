import { readFileSync } from "fs";
import { join } from "path";

import type { VenueAccess } from "@/utils/venue-access-types";

/**
 * The release shape this site reads. A release in another shape is refused
 * rather than read: it may have moved or renamed a field this page shows, and
 * misreading an access fact is worse than not showing one.
 */
const SUPPORTED_FORMAT_VERSION = 1;

let cached: Map<string, VenueAccess> | undefined;

/**
 * Load the venue-accessibility release downloaded beside the combined data.
 *
 * Read at build time only, like the departed films: venue pages render it into
 * static HTML, and none of it belongs in the payload every visitor downloads.
 *
 * The release carries only venues with something to say. A venue missing from
 * it is one nobody has checked yet, and a missing file is a build from before
 * the release existed - in both cases the page has no access section.
 */
function loadVenueAccessibility(): Map<string, VenueAccess> {
  if (cached) return cached;

  const filePath = join(
    process.cwd(),
    "venue-accessibility",
    "venue-accessibility.json",
  );

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    console.warn(
      "No venue-accessibility.json found; venue pages will have no access section.",
    );
    cached = new Map();
    return cached;
  }

  const release = JSON.parse(raw);
  if (release.formatVersion !== SUPPORTED_FORMAT_VERSION) {
    throw new Error(
      `venue-accessibility.json is format ${release.formatVersion}; this site reads format ${SUPPORTED_FORMAT_VERSION}`,
    );
  }
  cached = new Map(
    Object.entries(release.venues as Record<string, VenueAccess>),
  );
  return cached;
}

export function getVenueAccessibility(venueId: string): VenueAccess | null {
  return loadVenueAccessibility().get(venueId) ?? null;
}
