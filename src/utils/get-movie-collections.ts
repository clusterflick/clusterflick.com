import type { CollectionSummary, Movie } from "@/types";

/**
 * The collections to credit on a film's page.
 *
 * A film belongs to at most one collection, but a multi-film event has none of
 * its own — its identity comes from what it screens. A Friday the 13th
 * marathon is part of that collection in every sense a reader cares about, and
 * the collection page already lists it under "Also Showing As Part Of", so
 * this is the other half of that link.
 *
 * An event can draw on several series (a Halloween all-nighter mixing Scream
 * and A Nightmare on Elm Street), so it can name more than one, ordered by how
 * much of the event each accounts for.
 */
export function getMovieCollections(
  movie: Pick<Movie, "collectionId" | "includedMovies">,
  collections: Record<string, CollectionSummary>,
): CollectionSummary[] {
  if (movie.collectionId) {
    const collection = collections[movie.collectionId];
    return collection ? [collection] : [];
  }

  const countById = new Map<string, number>();
  for (const included of movie.includedMovies ?? []) {
    const id = included.collectionId;
    if (!id || !collections[id]) continue;
    countById.set(id, (countById.get(id) ?? 0) + 1);
  }

  return [...countById.entries()]
    .sort(
      ([idA, countA], [idB, countB]) =>
        countB - countA ||
        collections[idA].name.localeCompare(collections[idB].name),
    )
    .map(([id]) => collections[id]);
}
