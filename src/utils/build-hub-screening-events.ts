import type { Movie, Venue } from "@clusterflick/catalogue/types";
import { getMovieUrl } from "@clusterflick/catalogue/utils/get-movie-url";
import { buildScreeningEventSchema } from "@/utils/build-screening-event-schema";

/**
 * How many screenings a hub page (a format, an accessibility feature, live
 * scores) describes in its structured data. Enough to say what the page is
 * about and when; the film pages carry every screening, so a hub listing
 * hundreds would only grow its HTML.
 */
export const HUB_SCREENING_EVENT_LIMIT = 30;

/**
 * `ScreeningEvent`s for the soonest screenings on a hub page, across all its
 * films. `movies` must already be pruned to the hub's upcoming performances,
 * as `getFormatMovies` and its siblings return them. A screening whose venue
 * isn't in the dataset is skipped, as on the film page, since a
 * `ScreeningEvent` without a `location` is invalid.
 */
export function buildHubScreeningEvents(
  movies: Movie[],
  venues: Record<string, Venue>,
  limit: number = HUB_SCREENING_EVENT_LIMIT,
): Record<string, unknown>[] {
  return movies
    .flatMap((movie) =>
      movie.performances.flatMap((performance) => {
        const showing = movie.showings[performance.showingId];
        const venue = showing ? venues[showing.venueId] : undefined;
        return venue ? [{ movie, performance, venue }] : [];
      }),
    )
    .sort((a, b) => a.performance.time - b.performance.time)
    .slice(0, limit)
    .map(({ movie, performance, venue }) =>
      buildScreeningEventSchema(
        performance,
        movie,
        `https://clusterflick.com${getMovieUrl(movie)}`,
        venue,
      ),
    );
}
