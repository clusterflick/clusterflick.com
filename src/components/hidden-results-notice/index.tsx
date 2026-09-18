"use client";

import clsx from "clsx";
import Button from "@/components/button";
import { formatDateLong } from "@/utils/format-date";
import styles from "./hidden-results-notice.module.css";

interface HiddenResultsNoticeProps {
  /** How many films the date window is keeping out. */
  count: number;
  /** When the soonest of them is on. */
  from: number;
  /** Widen the date range to reveal them. */
  onShowAll: () => void;
  className?: string;
}

/**
 * A quiet line under a short grid, saying what the date window is keeping out.
 *
 * Not a suggestion: the reader's search worked, and this is only pointing out
 * that the answer is narrower than it looks. It states a fact and offers one
 * way to act on it, where `FilterSuggestions` ranks several ways to rescue a
 * search that found nothing.
 *
 * The date is absolute even when it is days away, unlike the relative phrasing
 * the suggestion engine uses for a single next showing. This one begins a range
 * rather than naming an event, and "showing from in 3 days" does not read.
 */
export default function HiddenResultsNotice({
  count,
  from,
  onShowAll,
  className,
}: HiddenResultsNoticeProps) {
  return (
    <div className={clsx(styles.notice, className)} role="status">
      <p className={styles.text}>
        <strong className={styles.count}>
          {count.toLocaleString("en-GB")} more
        </strong>{" "}
        {count === 1 ? "film matches" : "films match"} your filters, showing
        from {formatDateLong(from)}.
      </p>
      <Button variant="link" onClick={onShowAll}>
        Show all dates
      </Button>
    </div>
  );
}
