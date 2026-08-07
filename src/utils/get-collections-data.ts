import { readFileSync } from "fs";
import { join } from "path";
import type { Collection } from "@/types";

/**
 * The full collection records, including each one's membership.
 *
 * These are deliberately kept out of the meta blob that every visitor
 * downloads — they're an order of magnitude larger than the naming fields, and
 * only the collection pages need them, at build time. See
 * `scripts/process-combined-data.js`.
 */
export function getCollectionsData(): Record<string, Collection> {
  const filePath = join(process.cwd(), "public", "data", "collections.json");
  const collections = JSON.parse(readFileSync(filePath, "utf-8")) as Record<
    string,
    Omit<Collection, "id">
  >;

  return Object.fromEntries(
    Object.entries(collections).map(([id, collection]) => [
      id,
      { ...collection, id },
    ]),
  );
}

/** The collection with the given slug, or undefined if there isn't one. */
export function findCollection(slug: string): Collection | undefined {
  return Object.values(getCollectionsData()).find(
    (collection) => collection.slug === slug,
  );
}
