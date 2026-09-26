import { readFileSync } from "fs";
import { join } from "path";
import { CinemaData } from "@/types";
import expandAndCombine from "./expand-and-combine";

let cached: { metaFilename: string; data: CinemaData } | undefined;

/**
 * Load the full dataset from the chunks in `public/data/`.
 *
 * Loaded once per process and shared. Every statically generated page asks for
 * it, most of them twice (metadata and page), and re-reading and re-parsing
 * every chunk each time was most of the build. Sharing one object also lets the
 * `WeakMap` caches keyed on `data.movies` (film lists, matchers) hit across
 * pages rather than being rebuilt for each one.
 *
 * Callers must treat the result as read-only: a mutation would leak into every
 * page rendered after it in the same worker.
 */
export async function getStaticData(): Promise<CinemaData> {
  const publicDir = join(process.cwd(), "public", "data");
  const metaFilename = process.env.NEXT_PUBLIC_DATA_FILENAME;

  if (!metaFilename) {
    throw new Error("NEXT_PUBLIC_DATA_FILENAME is not set");
  }

  if (cached?.metaFilename === metaFilename) return cached.data;

  const metaPath = join(publicDir, metaFilename);
  const metaContent = readFileSync(metaPath, "utf-8");
  const metaData = JSON.parse(metaContent);

  const chunkFiles = metaData.filenames.map((filename: string) => {
    const filePath = join(publicDir, filename);
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  });

  const data = expandAndCombine(metaData, chunkFiles);
  cached = { metaFilename, data };
  return data;
}
