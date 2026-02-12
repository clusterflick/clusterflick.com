import type {
  CinemaData,
  Movie,
  Venue,
  Person,
  Genre,
  MetaData,
} from "@/types";

function expandAndCombine(
  metaData: MetaData,
  chunkFiles: Record<string, unknown>[],
) {
  const movies = chunkFiles.reduce(
    (combined, data) => ({ ...combined, ...data }),
    {},
  );
  const combinedData = { ...metaData, movies } as CinemaData;
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
