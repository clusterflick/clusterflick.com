/**
 * The shape of a venue accessibility record, with no Node imports, so the
 * component and its stories can share it with the build-time loader
 * (`get-venue-accessibility.ts`, which reads the release file with `fs` and
 * can't be bundled for the browser).
 */

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
