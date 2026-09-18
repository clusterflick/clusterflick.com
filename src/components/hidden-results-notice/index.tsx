"use client";

import clsx from "clsx";
import {
  formatDateLong,
  formatDaysFromNow,
  getDaysFromNow,
  RELATIVE_DAY_LIMIT,
} from "@/utils/format-date";
import styles from "./hidden-results-notice.module.css";

interface HiddenResultsNoticeProps {
  /** How many films the date window is keeping out. */
  count: number;
  /** What the grid would hold once widened — the count taking this yields. */
  total: number;
  /** When the soonest hidden film is on. */
  from: number;
  /** Widen the date range to reveal them. */
  onShowAll: () => void;
  className?: string;
}

/**
 * A row under a short grid saying what the date window is keeping out.
 *
 * Shaped like a suggestion offer — command, then the fact, then the count it
 * yields — because it is the same kind of thing to press, even though it is
 * raised for the opposite reason: the reader's search worked, and this only
 * points out that the answer is narrower than it looks. Quieter for that
 * reason, with no accent border and no list around it.
 */
export default function HiddenResultsNotice({
  count,
  total,
  from,
  onShowAll,
  className,
}: HiddenResultsNoticeProps) {
  // The same fortnight rule the suggestions use: counting to a date is easier
  // than reading one until it is far enough out that the date is easier again.
  const days = getDaysFromNow(from, RELATIVE_DAY_LIMIT);
  const when = days === null ? formatDateLong(from) : formatDaysFromNow(days);

  return (
    <button
      type="button"
      className={clsx(styles.offer, className)}
      onClick={onShowAll}
    >
      <span className={styles.text}>
        <span className={styles.headline}>Show all dates</span>
        <span className={styles.change}>
          {count.toLocaleString("en-GB")} more {count === 1 ? "film" : "films"},
          next {days === null ? "on " : ""}
          {when}
        </span>
      </span>
      <span className={styles.count}>
        {total.toLocaleString("en-GB")} result{total === 1 ? "" : "s"}
      </span>
    </button>
  );
}
