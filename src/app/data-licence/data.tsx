/**
 * The two datasets published for reuse, and the internal artifacts that are
 * not. Kept beside the page rather than in `src/data` because nothing else
 * needs them — the About page only mentions the datasets and links here.
 */

/**
 * Everything published lives under one address on our own domain, served from
 * the latest releases by `scripts/fetch-published-data.js`. The index is the
 * way in: it describes every venue, names its files and the releases they came
 * from.
 */
export const DATA_INDEX_URL = "https://clusterflick.com/datasets/index.json";

/** Describes the per-venue JSON files: the schema they are validated against. */
export const DATA_SCHEMA_URL = "https://clusterflick.com/datasets/schema.json";

export const LICENSED_DATASETS = [
  {
    name: "Data file per venue",
    pattern: "https://clusterflick.com/datasets/venues/<venue-id>.json",
    archive: "https://github.com/clusterflick/data-transformed/releases",
  },
  {
    name: "Calendar file per venue",
    pattern: "https://clusterflick.com/datasets/calendars/<venue-id>.ics",
    archive: "https://github.com/clusterflick/data-calendar/releases",
  },
];

/**
 * The same credit in the three forms people actually need to paste. Kept
 * verbatim so that what a reader copies is what appears on their page.
 */
export const ATTRIBUTION_SNIPPETS = [
  {
    label: "Markdown",
    value:
      "Screening data from [Clusterflick](https://clusterflick.com) (CC BY 4.0)",
  },
  {
    label: "HTML",
    value:
      'Screening data from <a href="https://clusterflick.com">Clusterflick</a> (CC BY 4.0)',
  },
  {
    label: "Plain text",
    value: "Screening data from Clusterflick - clusterflick.com (CC BY 4.0)",
  },
];

export const INTERNAL_REPOS = [
  {
    name: "data-retrieved",
    note: "Raw scrapes, stored close to verbatim. The content belongs to the venue sites it came from.",
  },
  {
    name: "data-combined",
    note: "Everything merged into one file for the website to load. Carries whatever the upstream stages carry.",
  },
  {
    name: "data-cached",
    note: "Film metadata cached from TMDB. Theirs, not ours — get it from TMDB under your own terms.",
  },
  {
    name: "data-matched",
    note: "Ratings from IMDb, Letterboxd, Metacritic, Rotten Tomatoes and the Bechdel Test, each belonging to its source.",
  },
  {
    name: "data-diffed",
    note: "What changed between two runs, so the New Listings feed doesn't have to recompute it.",
  },
  {
    name: "data-analysed",
    note: "Hourly venue health telemetry, driving the status panel on the About page.",
  },
];
