import { Classification, type Movie } from "@/types";

const getMovieClassification = ({ classification }: Movie): Classification => {
  if (classification) return classification;
  return Classification.Unknown;
};

export default getMovieClassification;
