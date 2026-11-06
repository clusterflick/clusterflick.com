import type { OccasionRowItem } from "@/components/occasion-row";
import type { Movie, Venue } from "@/types";
import type { ScoredMovie } from "@/utils/get-discovery-movies";
import { formatDayAndDate, formatShowingTime } from "@/utils/format-date";

/**
 * A row of occasions as `OccasionRow` cards, which lead with the occasion
 * rather than the film. Shared by the home page and `/near-me`, which differ
 * only in where a card leads: the home page opens the film on its full
 * schedule, `/near-me` on its nearby showings.
 *
 * A film the occasion scoring didn't describe is left out rather than drawn
 * without its headline.
 */
export function getOccasionRowItems(
  occasions: ScoredMovie[],
  venues: Record<string, Pick<Venue, "name">> | undefined,
  getHref: (movie: Movie) => string,
): OccasionRowItem[] {
  return occasions.flatMap(({ movie, occasion }) =>
    occasion
      ? [
          {
            id: movie.id,
            href: getHref(movie),
            title: movie.title,
            // A double bill's own record often has no poster; its films do.
            posterPath:
              movie.posterPath ??
              movie.includedMovies?.find((included) => included.posterPath)
                ?.posterPath,
            occasion: occasion.label,
            when: `${formatDayAndDate(occasion.time)}, ${formatShowingTime(occasion.time)}`,
            venue: venues?.[occasion.venueId]?.name ?? null,
          },
        ]
      : [],
  );
}
