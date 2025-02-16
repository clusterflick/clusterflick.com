import { Classification, classificationOrder, type Movie } from "@/types";

const getMovieClassification = ({
  classification,
  showings,
}: Movie): Classification => {
  if (classification) return classification;

  const classificationsFromShowings = Object.values(showings).reduce(
    (showingClassifications, { overview }) =>
      overview.classification &&
      classificationOrder.includes(overview.classification as Classification)
        ? showingClassifications.add(overview.classification as Classification)
        : showingClassifications,
    new Set<Classification>(),
  );

  if (classificationsFromShowings.size === 1) {
    return [...classificationsFromShowings][0].toUpperCase() as Classification;
  }

  return Classification.Unknown;
};

export default getMovieClassification;
