import { decompress } from "compress-json";
import type { MetaData, CinemaData } from "@/types";

/**
 * Fetch and decompress the metadata file from public/data.
 * Uses the NEXT_PUBLIC_DATA_FILENAME env var set in .storybook/main.ts.
 */
export async function fetchMetaData(): Promise<MetaData> {
  const metaFilename = process.env.NEXT_PUBLIC_DATA_FILENAME;
  if (!metaFilename) {
    throw new Error("NEXT_PUBLIC_DATA_FILENAME is not set");
  }

  const response = await fetch(`/data/${metaFilename}`);
  const compressed = await response.json();
  return decompress(compressed) as MetaData;
}

/**
 * Fetch and decompress all movie data files referenced in metadata.
 * Returns a combined record of all movies with IDs populated.
 */
export async function fetchAllMovies(
  metaData: MetaData,
): Promise<CinemaData["movies"]> {
  const allMovies: CinemaData["movies"] = {};

  for (const filename of metaData.filenames) {
    const response = await fetch(`/data/${filename}`);
    const compressed = await response.json();
    const movies = decompress(compressed) as CinemaData["movies"];

    for (const [id, movie] of Object.entries(movies)) {
      movie.id = id;
      allMovies[id] = movie;
    }
  }

  return allMovies;
}
