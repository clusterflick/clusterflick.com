import type {
  DataSource,
  FetchMethod,
  RobotsVerdict,
  SourceGroup,
  TermsVerdict,
} from "@/data/reports/data-sources-2026";

type TagColor = "pink" | "blue" | "yellow" | "gray";

export const METHOD_LABELS: Record<FetchMethod, string> = {
  api: "Official API",
  dataset: "Published dataset",
  named: "Plain request naming Clusterflick",
  plain: "Plain request",
  "browser-ua": "Plain request with a browser user agent",
  stealth: "Stealth headless browser",
  camoufox: "Camoufox when challenged",
  account: "Signed in with our own account",
};

export const ROBOTS_LABELS: Record<RobotsVerdict, string> = {
  "not-applicable": "Doesn't apply",
  none: "None published",
  allows: "Allows",
  "disallows-intent": "Disallows, by intent",
  disallows: "Disallows",
};

export const TERMS_LABELS: Record<TermsVerdict, string> = {
  licence: "Licence",
  "none-found": "No terms found",
  silent: "Nothing on automated access",
  restricts: "Limits reuse",
  borderline: "Borderline",
  bans: "Bans automated access",
};

// Colour says how far we are from a site's rules: pink is a clash, yellow
// is arguable (access limited without naming scraping, or reuse of the
// content limited), gray says nothing either way. The label always says
// which in words too.
export const ROBOTS_COLORS: Record<RobotsVerdict, TagColor> = {
  "not-applicable": "gray",
  none: "gray",
  allows: "gray",
  "disallows-intent": "pink",
  disallows: "pink",
};

export const TERMS_COLORS: Record<TermsVerdict, TagColor> = {
  licence: "gray",
  "none-found": "gray",
  silent: "gray",
  restricts: "yellow",
  borderline: "yellow",
  bans: "pink",
};

export const GROUP_LABELS: Record<SourceGroup, string> = {
  "film-data": "Film data and ratings",
  platforms: "Ticketing and listings platforms",
  chains: "Cinema chains and shared booking systems",
  "venue-sites": "Venues' own websites",
};

export const disallowsOurPaths = (source: DataSource) =>
  source.robots === "disallows" || source.robots === "disallows-intent";

/** What we do goes against the site's own published rules. */
export const isClash = (source: DataSource) =>
  disallowsOurPaths(source) || source.terms === "bans";

export const getSourceAnchor = (source: Pick<DataSource, "id">) =>
  `source-${source.id}`;

/** "2026-01-06" → "6 January 2026", "2024-04" → "April 2024". */
export function formatTermsDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!month) return String(year);
  return new Date(Date.UTC(year, month - 1, day ?? 1)).toLocaleDateString(
    "en-GB",
    {
      ...(day ? { day: "numeric" } : {}),
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  );
}
