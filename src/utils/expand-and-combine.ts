import type { CinemaData, Movie, Venue, Person, Genre } from "@/types";
import { type Compressed, decompress } from "compress-json";

function expandAndCombine(filenames: string[], compressedFiles: Compressed[]) {
  const data = compressedFiles.map(decompress);
  const combinedData = filenames.reduce(
    (combined, filename, index) => {
      const [, key] = filename.split(".");
      const fileData = data[index];
      if (key === "common") return { ...combined, ...fileData };
      return { ...combined, movies: { ...combined.movies, ...fileData } };
    },
    { movies: {} } as CinemaData,
  );

  const keysWithIds = ["genres", "movies", "people", "venues"] as Partial<
    keyof CinemaData
  >[];
  keysWithIds.forEach((key) => {
    Object.keys(combinedData[key]).forEach((id: string) => {
      const entry = combinedData[key] as
        | Record<string, Movie>
        | Record<string, Venue>
        | Record<string, Person>
        | Record<string, Genre>;
      entry[id].id = id;
    });
  });

  Object.values(combinedData.movies).forEach(({ showings }) => {
    Object.keys(showings).forEach((id: string) => {
      showings[id].id = id;
    });
  });

  return combinedData;
}

export default expandAndCombine;
