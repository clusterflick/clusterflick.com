import { Category } from "../types";

/**
 * Every category a search can pick, as the site labels them, in the order it
 * lists them.
 */
export const EVENT_CATEGORIES: { value: Category; label: string }[] = [
  { value: Category.Movie, label: "Films" },
  { value: Category.MultipleMovies, label: "Multiple Films" },
  { value: Category.Shorts, label: "Short Films" },
  { value: Category.Tv, label: "TV" },
  { value: Category.Quiz, label: "Quizzes" },
  { value: Category.Comedy, label: "Comedy" },
  { value: Category.Music, label: "Music" },
  { value: Category.Talk, label: "Talks" },
  { value: Category.Workshop, label: "Workshops" },
  { value: Category.Event, label: "Other Events" },
];
