import clsx from "clsx";
import type { MoviePerformance, Showing, Venue } from "@/types";
import MovieSummary from "@/components/movie-summary";
import type { EventPosterIncludedMovie } from "@/components/event-poster";
import PlannerLane, { PlannerLaneCard } from "@/components/planner-lane";
import { ButtonLink } from "@/components/button";
import { setUseBrowserBack } from "@/utils/nav-links";
import styles from "./planner-row.module.css";

/**
 * Most performances a row renders before handing over to the listing page.
 *
 * A safety valve for the unfiltered case, not the expected state. Measured on a
 * September 2026 release, per film per day: with the 3–5 nearest cinemas
 * selected the 95th percentile is 8–10 performances and fewer than 2% of rows
 * exceed 15; unfiltered, the busiest film had 510 in one day.
 */
export const PLANNER_ROW_LIMIT = 15;

export interface PlannerRowMovie {
  id: string;
  title: string;
  year?: string;
  originalTitle?: string;
  classification?: string;
  duration?: number;
  posterPath?: string;
  includedMovies?: EventPosterIncludedMovie[];
  showings: Record<string, Showing>;
}

interface PlannerRowProps {
  movie: PlannerRowMovie;
  /** The listing page, for the summary and the overflow link. */
  href: string;
  /** This day's performances, in time order. */
  performances: MoviePerformance[];
  venues: Record<string, Venue>;
  /** Genre names, already resolved from ids. */
  genres?: string[];
  /** Resolves the compressed URLs in the dataset (`useCinemaData`). */
  hydrateUrl: (url: string) => string;
  /** Defaults to `PLANNER_ROW_LIMIT`. */
  limit?: number;
  className?: string;
}

/**
 * One film's line in the planner: a condensed summary above a horizontally
 * scrolling strip of that day's performances. Past the limit, the strip ends
 * in a link to the listing page rather than rendering them all.
 */
export default function PlannerRow({
  movie,
  href,
  performances,
  venues,
  genres,
  hydrateUrl,
  limit = PLANNER_ROW_LIMIT,
  className,
}: PlannerRowProps) {
  const shown = performances.slice(0, limit);
  const hiddenCount = performances.length - shown.length;

  return (
    <article className={clsx(styles.row, className)}>
      <MovieSummary
        href={href}
        title={movie.title}
        year={movie.year}
        originalTitle={movie.originalTitle}
        classification={movie.classification}
        duration={movie.duration}
        genres={genres}
        posterPath={movie.posterPath}
        includedMovies={movie.includedMovies}
      />
      <PlannerLane>
        {shown.map((performance, index) => (
          <PlannerLaneCard
            key={`${performance.showingId}-${performance.time}-${index}`}
            movie={movie}
            performance={performance}
            venues={venues}
            hydrateUrl={hydrateUrl}
          />
        ))}
        {hiddenCount > 0 && (
          // Sets the back-button flag on the way out, as the film links do,
          // so the listing page's back returns here rather than to /films.
          <div className={styles.more} onClick={setUseBrowserBack}>
            <ButtonLink href={href} variant="secondary" size="sm">
              and {hiddenCount.toLocaleString("en-GB")} more
            </ButtonLink>
          </div>
        )}
      </PlannerLane>
    </article>
  );
}
