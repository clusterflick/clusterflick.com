"use client";

import clsx from "clsx";
import { FilterChip } from "@/lib/filters";
import styles from "./filter-overlay.module.css";

interface ActiveFiltersSectionProps {
  chips: FilterChip[];
  /** Bring the chip's controls into view, opening its Refine row if need be. */
  onOpen: (chip: FilterChip) => void;
  onRemove: (chip: FilterChip) => void;
}

/**
 * Every filter currently narrowing the results, one chip each. It is what
 * makes a filter set from elsewhere — a link, a film page, an earlier visit —
 * visible without opening the section it lives in. A chip's label goes to
 * its controls; its × removes it.
 *
 * The defaults (the date window and the event types) are listed too, marked
 * as such: they are the filters people most often don't realise are on.
 */
export default function ActiveFiltersSection({
  chips,
  onOpen,
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
          <li
            key={chip.key}
            className={clsx(
              styles.activeChip,
              chip.isDefault && styles.activeChipDefault,
            )}
          >
            {/* Accessible names keep the visible text in one piece ("Default
                This Week"), so voice control can match them. */}
            <button
              type="button"
              className={styles.activeChipOpen}
              onClick={() => onOpen(chip)}
            >
              <span className={styles.visuallyHidden}>Change filter: </span>
              {chip.isDefault && (
                <span className={styles.activeChipTag}>Default</span>
              )}
              <span className={styles.activeChipLabel}>{chip.label}</span>
            </button>
            <button
              type="button"
              className={styles.activeChipRemove}
              onClick={() => onRemove(chip)}
            >
              <span className={styles.visuallyHidden}>
                Remove filter: {chip.isDefault ? "Default " : ""}
                {chip.label}
              </span>
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
