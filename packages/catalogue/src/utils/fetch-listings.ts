import { CURRENT_DATA_FILE, DATA_FORMAT_VERSION } from "../data-format.mjs";
import type { CinemaData, CurrentData, MetaData, Movie } from "../types";
import { readListings } from "./read-listings";

/**
 * The listings as the site publishes them under `<origin>/data/`, fetched
 * and checked, for a Worker reading them from outside the site: the pointer
 * (`current.json`) first, then the release it names. Every failure, from no
 * answer to a data format this version of the package doesn't read, is a
 * `ListingsUnavailableError`.
 *
 * Only the fetching: how long to hold them, and what to do when they can't be
 * read, is each Worker's own. A search can carry on with the last good copy;
 * a nightly email can't.
 */

export class ListingsUnavailableError extends Error {
  name = "ListingsUnavailableError";
}

const META_FILE = /^data\.meta\.[0-9a-f]{10}\.json$/;
const CHUNK_FILE = /^data\.\d+\.[0-9a-f]{10}\.json$/;

/**
 * A file of the site's, or why it couldn't be read: no answer, an error, or
 * something that isn't JSON are all the listings being unavailable.
 */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new ListingsUnavailableError(`${url} didn't answer: ${error}`);
  }
  if (!response.ok) {
    throw new ListingsUnavailableError(`${url} answered ${response.status}`);
  }
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ListingsUnavailableError(`${url} isn't JSON: ${error}`);
  }
}

function checkFormat(version: unknown, file: string) {
  if (version !== DATA_FORMAT_VERSION) {
    throw new ListingsUnavailableError(
      `${file} is in data format ${String(version)}; this reads ` +
        `${DATA_FORMAT_VERSION}. Update @clusterflick/catalogue.`,
    );
  }
}

/**
 * The meta file of the current release, from `current.json`, never from a
 * cache: it's how a new release is noticed. One small fetch, so it's cheap to
 * ask before deciding whether to read the release again.
 */
export async function fetchCurrentRelease(origin: string): Promise<string> {
  const pointer = await fetchJson<CurrentData>(
    `${origin}/data/${CURRENT_DATA_FILE}`,
    { cache: "no-store" },
  );
  checkFormat(pointer.formatVersion, CURRENT_DATA_FILE);
  if (typeof pointer.meta !== "string" || !META_FILE.test(pointer.meta)) {
    throw new ListingsUnavailableError(
      `${CURRENT_DATA_FILE} names no meta file: ${JSON.stringify(pointer.meta)}`,
    );
  }
  return pointer.meta;
}

/**
 * The release a meta file names, read as the site reads it (`readListings`):
 * ids restored, nothing before today in London. Its files are named by their
 * content, so they can come from a cache.
 */
export async function fetchRelease(
  origin: string,
  metaFile: string,
): Promise<CinemaData> {
  if (!META_FILE.test(metaFile)) {
    throw new ListingsUnavailableError(`Not a meta file: ${metaFile}`);
  }
  const base = `${origin}/data/`;
  const meta = await fetchJson<MetaData>(base + metaFile);
  checkFormat(meta.formatVersion, metaFile);
  const bad = meta.filenames.find((name) => !CHUNK_FILE.test(name));
  if (bad !== undefined) {
    throw new ListingsUnavailableError(
      `${metaFile} names a chunk that isn't one: ${JSON.stringify(bad)}`,
    );
  }
  const chunks = await Promise.all(
    meta.filenames.map((name) => fetchJson<Record<string, Movie>>(base + name)),
  );
  return readListings(meta, chunks);
}
