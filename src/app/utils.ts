import { Category } from "@/types";

export const formatCategory = (category: Category): string => {
  const labels: Record<Category, string> = {
    [Category.Movie]: "Movie",
    [Category.MultipleMovies]: "Multiple Movies",
    [Category.Tv]: "TV",
    [Category.Quiz]: "Quiz",
    [Category.Comedy]: "Comedy",
    [Category.Music]: "Music",
    [Category.Talk]: "Talk",
    [Category.Workshop]: "Workshop",
    [Category.Shorts]: "Shorts",
    [Category.Event]: "Event",
  };
  return labels[category] || category;
};
