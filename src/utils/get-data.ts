import type { CinemaData } from "@/types";
import { type Compressed, decompress } from "compress-json";
import getDataFilename from "./get-data-filename";

const getData = async () => {
  const filename = getDataFilename();
  const compressedData = await import(`../../public/${filename}`, {
    with: { type: "json" },
  });
  return decompress(compressedData.default as Compressed) as CinemaData;
};

export default getData;
