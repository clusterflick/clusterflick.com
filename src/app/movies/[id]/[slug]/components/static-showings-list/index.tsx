import type { MoviePerformance, Showing, Venue } from "@/types";
import {
  formatDateLong,
  getDaysFromNow,
  formatDaysFromNow,
} from "@/utils/format-date";
import { titlesDiffer } from "@/utils/title-differs";
import PerformanceCard from "../showings-section/performance-card";
import styles from "../showings-section/showings-section.module.css";

// How many upcoming performances to bake into the static HTML. Half of the 50
// used for the JSON-LD ScreeningEvent structured data — enough to fully cover
// the ~93% of films with 25 or fewer showings while keeping the long tail of
// heavily-screened blockbusters from bloating the page.
const STATIC_PERFORMANCE_LIMIT = 25;

interface StaticShowingsListProps {
  performances: MoviePerformance[];
  showings: Record<string, Showing>;
  venues: Record<string, Venue>;
  movieTitle: string;
  /**
   * Build timestamp (from `data.generatedAt`). Used instead of `Date.now()` so
   * the render is deterministic — this is rendered inside `ShowingsSection`
   * pre-hydration, where the server output and first client render must match.
   */
  buildTime: number;
}

/**
 * SEO-only rendering of a film's next upcoming showings, server-rendered inside
 * `ShowingsSection` and shown until it hydrates. Reuses the shared
 * `PerformanceCard` and card CSS so it's visually identical to the interactive
 * list, but is deliberately non-interactive — no card links, booking buttons or
 * sold-out/finished badges, since those are perishable and useless to crawlers.
 */
export default function StaticShowingsList({
  performances,
  showings,
  venues,
  movieTitle,
  buildTime,
}: StaticShowingsListProps) {
  const upcoming = performances
    .filter((performance) => performance.time >= buildTime)
    .sort((a, b) => a.time - b.time)
    .slice(0, STATIC_PERFORMANCE_LIMIT);

  if (upcoming.length === 0) return null;

  const groups = new Map<string, MoviePerformance[]>();
  for (const performance of upcoming) {
    const date = formatDateLong(performance.time);
    const group = groups.get(date);
    if (group) {
      group.push(performance);
    } else {
      groups.set(date, [performance]);
    }
  }

  return (
    <>
      {Array.from(groups, ([date, datePerformances]) => {
        const daysFromNow = getDaysFromNow(datePerformances[0].time);
        return (
          <div key={date}>
            <h3 className={styles.dateHeader}>
              {date}
              {daysFromNow !== null && (
                <span className={styles.daysFromNow}>
                  {formatDaysFromNow(daysFromNow)}
                </span>
              )}
            </h3>
            <div className={styles.staticPerformancesRow}>
              {datePerformances.map((performance, index) => {
                const showing = showings[performance.showingId];
                const venue = showing ? venues[showing.venueId] : undefined;
                const showingTitle =
                  showing?.title && titlesDiffer(movieTitle, showing.title)
                    ? showing.title
                    : undefined;
                return (
                  <PerformanceCard
                    key={`${performance.showingId}-${index}`}
                    time={performance.time}
                    venueName={venue?.name}
                    showingTitle={showingTitle}
                    screen={performance.screen}
                    accessibility={performance.accessibility}
                    notes={performance.notes}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
