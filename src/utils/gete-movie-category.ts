import { Category, type Movie } from "@/types";

export const getMovieCategory = (movie: Movie) => {
  const categories = Array.from(
    new Set(Object.values(movie.showings).map(({ category }) => category)),
  );
  const categoriesWithoutDefault = categories.filter(
    (category) => category !== Category.Event,
  );
  if (categoriesWithoutDefault.length === 0) return categories[0];
  return categoriesWithoutDefault[0];
};

const categoryLabels: Record<string, string> = {
  movie: "Movie",
  "multiple-movies": "Movie Marathon",
  tv: "TV",
  quiz: "Quiz",
  comedy: "Comedy",
  music: "Music",
  talk: "Talk",
  workshop: "Workshop",
  shorts: "Short Movies",
  event: "Event",
};

export const getCategoryLabel = (categoryKey: string) => {
  return categoryLabels[categoryKey] || categoryLabels.event;
};
