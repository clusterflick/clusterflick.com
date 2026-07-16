"use client";

import clsx from "clsx";
import styles from "./filter-overlay.module.css";

interface QuickFiltersSectionProps {
  /** Films/shorts/multi-film events at nearby venues, today, hiding past showings. */
  onNearMeToday: () => void;
  /** Films/shorts/multi-film events across all venues, this week. */
  onThisWeek: () => void;
  /** All event types, all venues, any time. */
  onEverything: () => void;
  /** True while the browser is resolving the user's location for "near me". */
  geoLoading: boolean;
  /** True when the current filters match the "near me today" preset. */
  nearMeTodayActive?: boolean;
  /** True when the current filters match the "this week" preset. */
  thisWeekActive?: boolean;
  /** True when the current filters match the "everything" preset. */
  everythingActive?: boolean;
}

/**
 * One-tap preset filters shown at the very top of the filter overlay. Each card
 * applies a whole preset atomically (event types + venues + dates), giving users
 * a fast path to the most common views without touching individual controls.
 */
export default function QuickFiltersSection({
  onNearMeToday,
  onThisWeek,
  onEverything,
  geoLoading,
  nearMeTodayActive = false,
  thisWeekActive = false,
  everythingActive = false,
}: QuickFiltersSectionProps) {
  return (
    <section className={styles.quickSection} aria-label="Quick filters">
      <div className={styles.quickGrid}>
        <button
          type="button"
          className={clsx(
            styles.quickCard,
            nearMeTodayActive && styles.quickCardActive,
          )}
          onClick={onNearMeToday}
          disabled={geoLoading}
          aria-pressed={nearMeTodayActive}
        >
          <span className={styles.quickIcon} aria-hidden="true">
            📍
          </span>
          <span className={styles.quickLabel}>
            {geoLoading ? "Locating…" : "What's on near me today"}
          </span>
          <span className={styles.quickDescription}>
            Films, shorts &amp; multi-films showing nearby today
          </span>
        </button>

        <button
          type="button"
          className={clsx(
            styles.quickCard,
            thisWeekActive && styles.quickCardActive,
          )}
          onClick={onThisWeek}
          aria-pressed={thisWeekActive}
        >
          <span className={styles.quickIcon} aria-hidden="true">
            🗓️
          </span>
          <span className={styles.quickLabel}>What&apos;s on this week</span>
          <span className={styles.quickDescription}>
            Films, shorts &amp; multi-film across all venues
          </span>
        </button>

        <button
          type="button"
          className={clsx(
            styles.quickCard,
            everythingActive && styles.quickCardActive,
          )}
          onClick={onEverything}
          aria-pressed={everythingActive}
        >
          <span className={styles.quickIcon} aria-hidden="true">
            🎬
          </span>
          <span className={styles.quickLabel}>Show me everything</span>
          <span className={styles.quickDescription}>
            All event types, all venues, any time
          </span>
        </button>
      </div>
    </section>
  );
}
