import type { Movie } from "@clusterflick/catalogue/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Which of the reader's watchlist films each venue has a bookable showing of
 * in the coming week (not started, not sold out), soonest first: the week the
 * home page's figures count, since it's the window nearly every venue has
 * published. A venue with none has no entry.
 */
export function getWatchlistAtVenues(
  movies: Record<string, Movie>,
  watchlistIds: string[],
  now: number,
): Map<string, Movie["id"][]> {
  const end = now + WEEK_MS;
  // The film's soonest bookable showing at each venue.
  const soonest = new Map<string, Map<Movie["id"], number>>();
  for (const id of watchlistIds) {
    const movie = movies[id];
    if (!movie) continue;
    for (const performance of movie.performances) {
      if (performance.time < now || performance.time >= end) continue;
      if (performance.status?.soldOut) continue;
      const venueId = movie.showings[performance.showingId]?.venueId;
      if (!venueId) continue;
      const films = soonest.get(venueId) ?? new Map<Movie["id"], number>();
      const time = films.get(id);
      if (time === undefined || performance.time < time) {
        films.set(id, performance.time);
      }
      soonest.set(venueId, films);
    }
  }
  return new Map(
    [...soonest].map(([venueId, films]) => [
      venueId,
      [...films].sort((a, b) => a[1] - b[1]).map(([id]) => id),
    ]),
  );
}

/**
 * The venue card's line: the soonest film by name, and how many more. "Paris,
 * Texas", "Paris, Texas + 2 more".
 */
export function formatWatchlistAtVenue(titles: string[]): string | undefined {
  if (titles.length === 0) return undefined;
  const [first, ...rest] = titles;
  return rest.length === 0 ? first : `${first} + ${rest.length} more`;
}
