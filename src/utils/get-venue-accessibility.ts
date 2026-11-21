import { readFileSync } from "fs";
import { join } from "path";

/**
 * Venue accessibility: what a venue's building and screens offer, from
 * clusterflick/venue-accessibility. Each fact is something a cited source
 * said, quoted; see that repository's README for the rules.
 *
 * This is about the building. What a screening offers (subtitles, audio
 * description, relaxed) is `performance.accessibility`, in the listings.
 */

export type AccessStatus =
  | "yes"
  | "no"
  | "partial"
  | "unknown"
  | "not_applicable";

export interface AccessSource {
  url: string;
  tier: 1 | 2;
  source_last_updated: string | null;
  /** YYYY-MM-DD */
  checked_on: string;
  quote: string | null;
  /** A policy the chain states for every venue, not this one. */
  chain_wide?: boolean;
}

export interface AccessFact {
  status: AccessStatus;
  note: string | null;
  sources: AccessSource[];
  /** How the sources disagree, when they do. */
  conflict: string | null;
  /** The last report found from a source not trusted for a status. */
  last_found: {
    claim: string;
    url: string;
    tier: 3;
    found_on: string;
  } | null;
}

export interface AccessCountFact extends AccessFact {
  count: number | null;
}

export interface AccessPositionFact extends AccessFact {
  value: "front" | "middle" | "rear" | "mixed" | "unknown";
}

export interface AccessScreen {
  name: string;
  aliases?: string[];
  step_free: AccessFact;
  wheelchair_spaces: AccessCountFact;
  space_position: AccessPositionFact;
  transfer_seating: AccessFact;
  hearing_assist: AccessFact;
  notes: string | null;
}

export const VENUE_ACCESS_FIELDS = [
  "step_free_access",
  "entrance_step_free",
  "alt_accessible_entrance",
  "lift",
  "accessible_toilet",
  "changing_places",
  "assistance_dogs",
  "quiet_space",
  "hearing_assist_counters",
] as const;

export type VenueAccessField = (typeof VENUE_ACCESS_FIELDS)[number];

export type VenueAccess = {
  id: string;
  access_page_url: string | null;
  access_contact: string | null;
  notes: string | null;
  screens: AccessScreen[];
} & Record<VenueAccessField, AccessFact>;

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
