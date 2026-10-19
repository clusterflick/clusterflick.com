import type { MetaData } from "@/types";

/**
 * Whether every film in `movieIds` that the dataset holds has arrived, by way
 * of the chunks `metaData.mapping` puts it in. An id the dataset doesn't hold
 * is in no chunk, so there is nothing to wait for. A chunk that failed is
 * never loaded, so a caller should also stop waiting once loading has ended.
 */
export function haveMoviesLoaded(
  metaData: Pick<MetaData, "mapping" | "filenames">,
  loadedFiles: ReadonlySet<string>,
  movieIds: Iterable<string>,
): boolean {
  const wanted = new Set(movieIds);
  if (wanted.size === 0) return true;
  for (const [key, ids] of Object.entries(metaData.mapping)) {
    const filename = metaData.filenames[parseInt(key, 10)];
    if (loadedFiles.has(filename)) continue;
    if (ids.some((id) => wanted.has(id))) return false;
  }
  return true;
}
