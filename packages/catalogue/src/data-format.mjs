/**
 * The listings as the site publishes them (`scripts/process-combined-data.js`
 * in the site's repo): what a reader outside the site needs to find them and
 * to know whether it can read them.
 *
 * Plain ESM with no imports, as `utils/movie-ratings.mjs` is, so the site's
 * build script runs it under raw Node and TypeScript imports it too.
 */

/**
 * The shape of the published listings, `MetaData` and the movie chunks it
 * names. Raise it when a change would break a reader built against the old
 * shape: a field removed, renamed or changed in meaning. A new optional field
 * doesn't break one. Raising it is a major version of this package, and a
 * Worker refuses data in a version it wasn't built for.
 */
export const DATA_FORMAT_VERSION = 1;

/**
 * The one file in the site's `data/` with a fixed name: every other is named
 * by its content's hash. It names the current meta file, which names the
 * chunks, so a reader that can't list the directory starts here.
 */
export const CURRENT_DATA_FILE = "current.json";
