import type { Movie } from "@/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Which of these films have a showing someone could book in the coming week:
 * not started, not sold out. A week, as the home page's figures count, since
 * it's the window nearly every venue has published. In the order given.
 */
export function getShowingThisWeek(
  movies: Record<string, Movie>,
  ids: string[],
  now: number,
): string[] {
  const end = now + WEEK_MS;
  return ids.filter((id) =>
    movies[id]?.performances.some(
      (performance) =>
        performance.time >= now &&
        performance.time < end &&
        !performance.status?.soldOut,
    ),
  );
}
