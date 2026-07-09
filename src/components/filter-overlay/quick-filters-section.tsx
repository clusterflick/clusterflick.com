"use client";

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
}: QuickFiltersSectionProps) {
  return (
    <section className={styles.quickSection} aria-label="Quick filters">
      <div className={styles.quickGrid}>
        <button
          type="button"
          className={styles.quickCard}
          onClick={onNearMeToday}
          disabled={geoLoading}
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

        <button type="button" className={styles.quickCard} onClick={onThisWeek}>
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
          className={styles.quickCard}
          onClick={onEverything}
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
