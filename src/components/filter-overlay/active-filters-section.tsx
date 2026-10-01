"use client";

import clsx from "clsx";
import { FilterChip } from "@/lib/filters";
import styles from "./filter-overlay.module.css";

interface ActiveFiltersSectionProps {
  chips: FilterChip[];
  onRemove: (chip: FilterChip) => void;
}

/**
 * Every filter currently narrowing the results, one removable chip each. It
 * is what makes a filter set from elsewhere — a link, a film page, an earlier
 * visit — visible without opening the section it lives in.
 *
 * The defaults (the date window and the event types) are listed too, marked
 * as such: they are the filters people most often don't realise are on.
 */
export default function ActiveFiltersSection({
  chips,
  onRemove,
}: ActiveFiltersSectionProps) {
  if (chips.length === 0) return null;

  return (
    <section className={styles.activeSection} aria-labelledby="active-heading">
      <h3 id="active-heading" className={styles.activeHeading}>
        Filtering by
      </h3>
      <ul className={styles.activeList}>
        {chips.map((chip) => (
          <li key={chip.key}>
            {/* The accessible name keeps the visible text in one piece
                ("Default This Week"), so voice control can match it. */}
            <button
              type="button"
              className={clsx(
                styles.activeChip,
                chip.isDefault && styles.activeChipDefault,
              )}
              onClick={() => onRemove(chip)}
            >
              <span className={styles.visuallyHidden}>Remove filter: </span>
              {chip.isDefault && (
                <span className={styles.activeChipTag}>Default</span>
              )}
              <span className={styles.activeChipLabel}>{chip.label}</span>
              <span className={styles.activeChipRemove} aria-hidden="true">
                ×
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
