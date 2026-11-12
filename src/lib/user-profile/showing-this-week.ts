import type { Movie } from "@/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Which of these films have a showing someone could book from now until
 * `end`: not started, not sold out. In the order given.
 */
export function getBookable(
  movies: Record<string, Movie>,
  ids: string[],
  now: number,
  end = Infinity,
): string[] {
  return ids.filter((id) =>
    movies[id]?.performances.some(
      (performance) =>
        performance.time >= now &&
        performance.time < end &&
        !performance.status?.soldOut,
    ),
  );
}

/**
 * The same in the coming week, as the home page's figures count, since it's
 * the window nearly every venue has published.
 */
export function getShowingThisWeek(
  movies: Record<string, Movie>,
  ids: string[],
  now: number,
): string[] {
  return getBookable(movies, ids, now, now + WEEK_MS);
}
