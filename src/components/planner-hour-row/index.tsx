"use client";

import { Fragment, useState } from "react";
import clsx from "clsx";
import type { MoviePerformance, Venue } from "@/types";
import PlannerLane, {
  PlannerLaneCard,
  type PlannerLaneMovie,
} from "@/components/planner-lane";
import type { PerformanceCardFilm } from "@/components/performance-card";
import Button from "@/components/button";
import { formatShowingTime } from "@/utils/format-date";
import { groupBySameStart } from "@/utils/get-planner-day";
import styles from "./planner-hour-row.module.css";

/**
 * Cards an hour renders at first, and how many more each "Show more" adds.
 * Counted in cards after same-start grouping, not in performances.
 *
 * A ceiling on what a mounted row can cost, which binds only for a busy hour
 * with no venue filter. Measured on a September release, after grouping: 3
 * cards at the median hour, 15 at p90, 118 at p99, ~145 at the busiest. With a
 * handful of venues selected it never binds.
 */
export const PLANNER_HOUR_LIMIT = 50;

export interface PlannerHourRowItem {
  movie: PlannerLaneMovie & { id: string };
  performance: MoviePerformance;
  /** How the card names its film; the lane mixes films, so every card does. */
  film: PerformanceCardFilm;
}

interface PlannerHourRowProps {
  /** Heading for the hour, e.g. "19:00". */
  label: string;
  /** The hour's performances, in time order. */
  items: PlannerHourRowItem[];
  venues: Record<string, Venue>;
  /** Resolves the compressed URLs in the dataset (`useCinemaData`). */
  hydrateUrl: (url: string) => string;
  /** Defaults to `PLANNER_HOUR_LIMIT`. */
  limit?: number;
  className?: string;
}

/**
 * One hour of the planner's by-time view: the hour as a heading above a lane
 * of what starts in it, each card naming its film.
 *
 * A film starting at the same moment at several venues gets one card, with a
 * tab on its side to open the others in place — a wide release is otherwise a
 * long run of cards differing only by venue. The others aren't rendered until
 * opened.
 *
 * Past `limit` cards the lane ends in "Show more", which opens the next
 * `limit` in place — an hour has no page of its own to hand over to.
 */
export default function PlannerHourRow({
  label,
  items,
  venues,
  hydrateUrl,
  limit = PLANNER_HOUR_LIMIT,
  className,
}: PlannerHourRowProps) {
  const [shownCount, setShownCount] = useState(limit);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderCard = (
    { movie, performance, film }: PlannerHourRowItem,
    index: number,
  ) => (
    <PlannerLaneCard
      key={`${movie.id}-${performance.showingId}-${performance.time}-${index}`}
      movie={movie}
      performance={performance}
      venues={venues}
      hydrateUrl={hydrateUrl}
      film={film}
    />
  );

  const groups = groupBySameStart(items);
  const shown = groups.slice(0, shownCount);
  const remaining = groups.length - shown.length;
  const nextStep = Math.min(limit, remaining);

  return (
    <section className={clsx(styles.row, className)}>
      <h2 className={styles.heading}>
        {label}
        <span className={styles.count}>
          {items.length.toLocaleString("en-GB")}{" "}
          {items.length === 1 ? "showing" : "showings"}
        </span>
      </h2>
      <PlannerLane>
        {shown.map(({ key, first, rest }) => {
          if (rest.length === 0) return renderCard(first, 0);
          const isOpen = expanded.has(key);
          const time = formatShowingTime(first.performance.time);
          return (
            <Fragment key={key}>
              <div className={styles.group}>
                {renderCard(first, 0)}
                <button
                  type="button"
                  className={styles.more}
                  onClick={() => toggle(key)}
                  aria-expanded={isOpen}
                  aria-label={
                    isOpen
                      ? `Hide the other ${first.film.title} showings at ${time}`
                      : `Show ${rest.length} more ${first.film.title} ${
                          rest.length === 1 ? "showing" : "showings"
                        } at ${time}`
                  }
                >
                  {isOpen ? (
                    <span className={styles.moreLabel}>Hide</span>
                  ) : (
                    <>
                      <span className={styles.moreCount}>+{rest.length}</span>
                      <span className={styles.moreLabel}>
                        more at this time
                      </span>
                    </>
                  )}
                </button>
              </div>
              {isOpen && rest.map((item, index) => renderCard(item, index + 1))}
            </Fragment>
          );
        })}
        {remaining > 0 && (
          <div className={styles.showMore}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShownCount((count) => count + limit)}
            >
              Show {nextStep.toLocaleString("en-GB")} more
            </Button>
            {remaining > nextStep && (
              <span className={styles.showMoreCount}>
                of {remaining.toLocaleString("en-GB")}
              </span>
            )}
          </div>
        )}
      </PlannerLane>
    </section>
  );
}

interface PlannerHourGapProps {
  /** First empty hour, "15:00". */
  from: string;
  /** The hour things start again, "19:00". */
  until: string;
  className?: string;
}

/**
 * A run of empty hours between two busy ones, as one quiet divider — it shows
 * where the day has room without spending a row on each empty hour.
 */
export function PlannerHourGap({
  from,
  until,
  className,
}: PlannerHourGapProps) {
  return (
    <div className={clsx(styles.gap, className)}>
      Nothing starts between {from} and {until}
    </div>
  );
}
