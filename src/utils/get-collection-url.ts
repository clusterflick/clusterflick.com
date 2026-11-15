import type {
  Collection,
  CollectionSummary,
} from "@clusterflick/catalogue/types";

/** Canonical path for a collection landing page. */
export function getCollectionUrl(
  collection: Pick<Collection | CollectionSummary, "slug">,
): string {
  return `/collections/${collection.slug}`;
}
