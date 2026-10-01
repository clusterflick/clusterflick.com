"use client";

import clsx from "clsx";
import styles from "./filter-overlay.module.css";

interface QuickFiltersSectionProps {
  /** Films/shorts/multi-film events at nearby venues, today, hiding past showings. */
  onNearMeToday: () => void;
  /** Films/shorts/multi-film events across all venues, this week. */
  onThisWeek: () => void;
  /** True while the browser is resolving the user's location for "near me". */
  geoLoading: boolean;
  /** True when the current filters match the "near me today" preset. */
  nearMeTodayActive?: boolean;
  /** True when the current filters match the "this week" preset. */
  thisWeekActive?: boolean;
}

/**
 * One-tap preset filters, as slim pills in the overlay's sticky header. Each
 * applies a whole preset atomically (event types + venues + dates) and closes
 * the overlay. They were cards with an icon and a description, which cost a
 * band of the overlay for two buttons. "Show everything" is the third preset,
 * but it is the way out of every filter rather than a view of its own, so it
 * sits beside Reset instead.
 */
export default function QuickFiltersSection({
  onNearMeToday,
  onThisWeek,
  geoLoading,
  nearMeTodayActive = false,
  thisWeekActive = false,
}: QuickFiltersSectionProps) {
  return (
    <div className={styles.quickPills} role="group" aria-label="Quick filters">
      <button
        type="button"
        className={clsx(
          styles.quickPill,
          nearMeTodayActive && styles.quickPillActive,
        )}
        onClick={onNearMeToday}
        disabled={geoLoading}
        aria-pressed={nearMeTodayActive}
        title="Films, shorts & multi-film events showing nearby today"
      >
        {geoLoading ? "Locating…" : "Near me today"}
      </button>
      <button
        type="button"
        className={clsx(
          styles.quickPill,
          thisWeekActive && styles.quickPillActive,
        )}
        onClick={onThisWeek}
        aria-pressed={thisWeekActive}
        title="Films, shorts & multi-film events across all venues this week"
      >
        This week
      </button>
    </div>
  );
}
