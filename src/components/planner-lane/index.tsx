import type { ReactNode } from "react";
import clsx from "clsx";
import type { MoviePerformance, Showing, Venue } from "@/types";
import PosterScroller from "@/components/poster-row/scroller";
import PerformanceCard, {
  PerformanceCardActions,
  type PerformanceCardFilm,
  type PerformanceCardStatus,
} from "@/components/performance-card";
import { isInPast } from "@/utils/format-date";
import { setUseBrowserBack } from "@/utils/nav-links";
import { titlesDiffer } from "@/utils/title-differs";
import styles from "./planner-lane.module.css";

interface PlannerLaneProps {
  children: ReactNode;
  className?: string;
}

/**
 * A planner strip: a faint lane holding a horizontally scrolling line of
 * `PlannerLaneCard`s, with edge fades wherever more lies beyond.
 */
export default function PlannerLane({ children, className }: PlannerLaneProps) {
  return (
    <div className={clsx(styles.lane, className)}>
      <PosterScroller bleed={false}>{children}</PosterScroller>
    </div>
  );
}

/** The slice of a movie a lane card reads. */
export interface PlannerLaneMovie {
  title: string;
  showings: Record<string, Showing>;
}

interface PlannerLaneCardProps {
  movie: PlannerLaneMovie;
  performance: MoviePerformance;
  venues: Record<string, Venue>;
  /** Resolves the compressed URLs in the dataset (`useCinemaData`). */
  hydrateUrl: (url: string) => string;
  /** Name the film on the card, for lanes that mix films. */
  film?: PerformanceCardFilm;
}

function getStatus(
  performance: MoviePerformance,
): PerformanceCardStatus | undefined {
  if (isInPast(performance.time)) return "past";
  if (performance.status?.soldOut) return "soldOut";
  return undefined;
}

/** One performance as a compact, interactive card in a planner lane. */
export function PlannerLaneCard({
  movie,
  performance,
  venues,
  hydrateUrl,
  film,
}: PlannerLaneCardProps) {
  const showing = movie.showings[performance.showingId];
  const venue = showing ? venues[showing.venueId] : undefined;
  const status = getStatus(performance);

  return (
    <PerformanceCard
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
      film={film}
      onFilmClick={setUseBrowserBack}
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
}
