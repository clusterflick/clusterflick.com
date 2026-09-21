import clsx from "clsx";
import {
  dateStringToLondonTimestamp,
  formatDateLong,
} from "@/utils/format-date";
import type { DateString } from "@/utils/get-planner-day";
import styles from "./planner-days.module.css";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/** The weekday of a calendar date, 0 for Sunday. */
function getWeekday(date: DateString): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export interface PlannerDaysProps {
  /** The days the strip covers, in order (`getPlannerWeek`). */
  days: DateString[];
  /** Which of `days` the film is on. */
  showing: Set<DateString>;
  /** The day being viewed, ringed. */
  selected: DateString;
  /** The date range carries on before the first day shown. */
  continuesBefore?: boolean;
  /** The date range carries on after the last day shown. */
  continuesAfter?: boolean;
  /** The film is showing before the first day shown. */
  moreBefore?: boolean;
  /** The film is showing after the last day shown. */
  moreAfter?: boolean;
  onSelect: (date: DateString) => void;
  className?: string;
}

/** One end of the strip: a bar where the range stops, dots where it carries
 * on — blue when the film is showing out there too. */
function Edge({ continues, more }: { continues?: boolean; more?: boolean }) {
  return (
    <span
      className={clsx(
        styles.edge,
        continues ? styles.continues : styles.stops,
        continues && more && styles.more,
      )}
      aria-hidden
    >
      {continues && (
        <>
          <span />
          <span />
        </>
      )}
    </span>
  );
}

/**
 * A film's week around the day in view: a dot per day, filled where it is
 * showing and ringed on the day in view. Showing days are buttons that go to
 * that day. Each end says whether the date range stops there (a bar) or
 * carries on past what is shown (dots, blue if the film is on out there).
 */
export default function PlannerDays({
  days,
  showing,
  selected,
  continuesBefore,
  continuesAfter,
  moreBefore,
  moreAfter,
  onSelect,
  className,
}: PlannerDaysProps) {
  return (
    <div
      className={clsx(styles.days, className)}
      role="group"
      aria-label="Other days showing"
    >
      <Edge continues={continuesBefore} more={moreBefore} />
      {days.map((date) => {
        const isShowing = showing.has(date);
        const isSelected = date === selected;
        const content = (
          <>
            <span className={styles.initial} aria-hidden>
              {WEEKDAY_INITIALS[getWeekday(date)]}
            </span>
            <span className={styles.dot} aria-hidden />
          </>
        );
        const cellClass = clsx(
          styles.day,
          isShowing && styles.showing,
          isSelected && styles.selected,
        );
        const label = formatDateLong(dateStringToLondonTimestamp(date));

        // Days it isn't on are shape only: the buttons already say which
        // days it is, and a list of absences is noise to a screen reader.
        if (!isShowing) {
          return (
            <span key={date} className={cellClass} aria-hidden>
              {content}
            </span>
          );
        }
        return (
          <button
            key={date}
            type="button"
            className={cellClass}
            aria-label={label}
            aria-current={isSelected ? "date" : undefined}
            title={label}
            onClick={() => onSelect(date)}
          >
            {content}
          </button>
        );
      })}
      <Edge continues={continuesAfter} more={moreAfter} />
    </div>
  );
}
