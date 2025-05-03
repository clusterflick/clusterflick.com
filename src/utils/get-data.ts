import getDataFilename from "./get-data-filename";
import expandAndCombine from "./expand-and-combine";

const getData = async () => {
  const filenames = getDataFilename();
  const compressedFiles = await Promise.all(
    filenames.map(
      async (filename) =>
        (await import(`../../public/${filename}`, { with: { type: "json" } }))
          .default,
    ),
  );
  const combinedData = expandAndCombine(filenames, compressedFiles);
  return combinedData;
};

export default getData;
