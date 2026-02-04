import { readFileSync } from "fs";
import { join } from "path";
import { decompress } from "compress-json";
import { CinemaData } from "@/types";
import expandAndCombine from "./expand-and-combine";

export async function getStaticData(): Promise<CinemaData> {
  const publicDir = join(process.cwd(), "public", "data");
  const metaFilename = process.env.NEXT_PUBLIC_DATA_FILENAME;

  if (!metaFilename) {
    throw new Error("NEXT_PUBLIC_DATA_FILENAME is not set");
  }

  const metaPath = join(publicDir, metaFilename);
  const metaContent = readFileSync(metaPath, "utf-8");
  const metaData = decompress(JSON.parse(metaContent));

  const compressedFiles = metaData.filenames.map((filename: string) => {
    const filePath = join(publicDir, filename);
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  });

  return expandAndCombine(metaData, compressedFiles);
}
