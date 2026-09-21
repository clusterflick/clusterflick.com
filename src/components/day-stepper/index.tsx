import clsx from "clsx";
import Button from "@/components/button";
import { ChevronDownIcon } from "@/components/icons";
import {
  LONDON_TIMEZONE,
  formatDaysFromNow,
  getDaysFromNow,
} from "@/utils/format-date";
import styles from "./day-stepper.module.css";

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: LONDON_TIMEZONE,
});

interface DayStepperProps {
  /** Any timestamp on the day being shown (London midnight, typically). */
  day: number;
  onPrevious: () => void;
  onNext: () => void;
  /** False at the start of the range: the previous control is disabled. */
  hasPrevious: boolean;
  /** False at the end of the range: the next control is disabled. */
  hasNext: boolean;
  className?: string;
}

/**
 * Steps through a range one day at a time: previous on the left, the day in
 * the middle, next on the right, on a single line at any width.
 */
export default function DayStepper({
  day,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  className,
}: DayStepperProps) {
  const daysFromNow = getDaysFromNow(day);

  return (
    <div className={clsx(styles.stepper, className)}>
      <Button
        variant="secondary"
        size="sm"
        className={styles.step}
        onClick={onPrevious}
        disabled={!hasPrevious}
        aria-label="Previous day"
      >
        <ChevronDownIcon size={18} className={styles.previousIcon} />
      </Button>
      {/* Announced on change, so stepping is not a silent swap of the list
          below for anyone not looking at the label. */}
      <div className={styles.label} aria-live="polite">
        <span className={styles.day}>{dayFormatter.format(day)}</span>
        {daysFromNow !== null && (
          <span className={styles.relative}>
            {formatDaysFromNow(daysFromNow)}
          </span>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className={styles.step}
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next day"
      >
        <ChevronDownIcon size={18} className={styles.nextIcon} />
      </Button>
    </div>
  );
}
