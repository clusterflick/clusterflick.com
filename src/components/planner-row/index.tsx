import clsx from "clsx";
import type { MoviePerformance, Showing, Venue } from "@/types";
import MovieSummary from "@/components/movie-summary";
import PosterScroller from "@/components/poster-row/scroller";
import PerformanceCard, {
  PerformanceCardActions,
  type PerformanceCardStatus,
} from "@/components/performance-card";
import { ButtonLink } from "@/components/button";
import { isInPast } from "@/utils/format-date";
import { setUseBrowserBack } from "@/utils/nav-links";
import { titlesDiffer } from "@/utils/title-differs";
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

function getStatus(
  performance: MoviePerformance,
): PerformanceCardStatus | undefined {
  if (isInPast(performance.time)) return "past";
  if (performance.status?.soldOut) return "soldOut";
  return undefined;
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
      />
      <div className={styles.lane}>
        <PosterScroller bleed={false}>
          {shown.map((performance, index) => {
            const showing = movie.showings[performance.showingId];
            const venue = showing ? venues[showing.venueId] : undefined;
            const status = getStatus(performance);
            return (
              <PerformanceCard
                key={`${performance.showingId}-${performance.time}-${index}`}
                size="compact"
                time={performance.time}
                venueName={venue?.name}
                showingTitle={
                  showing?.title && titlesDiffer(movie.title, showing.title)
                    ? showing.title
                    : undefined
                }
                screen={performance.screen}
                accessibility={performance.accessibility}
                format={performance.format}
                notes={performance.notes}
                status={status}
              >
                <PerformanceCardActions
                  showingUrl={showing ? hydrateUrl(showing.url) : undefined}
                  bookingUrl={hydrateUrl(performance.bookingUrl)}
                  venueName={venue?.name}
                  status={status}
                />
              </PerformanceCard>
            );
          })}
          {hiddenCount > 0 && (
            // Sets the back-button flag on the way out, as the film links do,
            // so the listing page's back returns here rather than to /films.
            <div className={styles.more} onClick={setUseBrowserBack}>
              <ButtonLink href={href} variant="secondary" size="sm">
                and {hiddenCount.toLocaleString("en-GB")} more
              </ButtonLink>
            </div>
          )}
        </PosterScroller>
      </div>
    </article>
  );
}
