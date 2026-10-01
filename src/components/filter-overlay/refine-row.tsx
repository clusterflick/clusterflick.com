"use client";

import { ReactNode, useId } from "react";
import clsx from "clsx";
import styles from "./filter-overlay.module.css";

interface RefineRowProps {
  /** Anchor for the active-filters strip: the row is `refine-<id>`. */
  id: string;
  title: string;
  /** What the filter is set to, or how it stands when it isn't. */
  summary: string;
  /** The filter is narrowing, so the summary is drawn as a selection. */
  isSet: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * One specialist filter in the overlay's Refine list: a single line naming the
 * filter and what it is set to, opening onto its controls. Each row opens on
 * its own, so the whole list can be read without opening anything — which is
 * what makes a filter findable — and opening one never reveals ten others.
 *
 * Controlled by the overlay, which opens a row when its filter becomes set
 * and when its chip in the active-filters strip is followed.
 */
export default function RefineRow({
  id,
  title,
  summary,
  isSet,
  open,
  onToggle,
  children,
}: RefineRowProps) {
  const bodyId = useId();

  return (
    <div
      id={`refine-${id}`}
      className={clsx(styles.refineRow, open && styles.refineRowOpen)}
    >
      <h4 className={styles.refineRowHeading}>
        <button
          type="button"
          className={styles.refineRowTrigger}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
        >
          <span className={styles.refineRowTitle}>{title}</span>
          <span
            className={clsx(
              styles.refineRowSummary,
              isSet && styles.refineRowSummarySet,
            )}
          >
            {summary}
          </span>
          <svg
            className={styles.refineRowChevron}
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </h4>
      <div id={bodyId} className={styles.refineRowBody} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
