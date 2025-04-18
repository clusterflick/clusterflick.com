import { Category, type Movie } from "@/types";

const getMovieCategory = (movie: Movie) => {
  const categories = Array.from(
    new Set(Object.values(movie.showings).map(({ category }) => category)),
  );
  const categoriesWithoutDefault = categories.filter(
    (category) => category !== Category.Event,
  );
  if (categoriesWithoutDefault.length === 0) return categories[0];
  return categoriesWithoutDefault[0];
};

export default getMovieCategory;
