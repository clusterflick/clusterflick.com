import type {
  CinemaData,
  MetaData,
  Movie,
} from "@clusterflick/catalogue/types";
import {
  expandMetaData,
  expandMovies,
} from "@clusterflick/catalogue/utils/read-listings";

/**
 * Every film the build has, past performances included: the build renders
 * pages for them. A reader's listings drop those (`readListings`).
 */
function expandAndCombine(
  metaData: MetaData,
  chunkFiles: Record<string, Movie>[],
): CinemaData {
  const movies: Record<string, Movie> = {};
  for (const chunk of chunkFiles) Object.assign(movies, expandMovies(chunk));
  return { ...expandMetaData(metaData), movies };
}

export default expandAndCombine;
