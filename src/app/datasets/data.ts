/**
 * Where the datasets published for reuse live. Everything is under one address
 * on our own domain, served from the latest releases by
 * `scripts/fetch-published-data.js`. Shared by /datasets, which documents them,
 * and /data-licence, which licenses them.
 */

/** The way in: every venue, its files, and the releases they came from. */
export const DATA_INDEX_URL = "https://clusterflick.com/datasets/index.json";

/** Only the index's `generatedAt` and `releases`: cheap to poll for new data. */
export const DATA_LATEST_URL = "https://clusterflick.com/datasets/latest.json";

/** Describes the per-venue JSON files: the schema they are validated against. */
export const DATA_SCHEMA_URL = "https://clusterflick.com/datasets/schema.json";

export const LICENSED_DATASETS = [
  {
    key: "data",
    name: "Data file per venue",
    pattern: "https://clusterflick.com/datasets/venues/<venue-id>.json",
    archive: "https://github.com/clusterflick/data-transformed/releases",
  },
  {
    key: "calendar",
    name: "Calendar file per venue",
    pattern: "https://clusterflick.com/datasets/calendars/<venue-id>.ics",
    archive: "https://github.com/clusterflick/data-calendar/releases",
  },
] as const;
