import clsx from "clsx";
import { formatDateLong } from "@/utils/format-date";
import styles from "./release-day-bars.module.css";

export interface ReleaseDayBarsItem {
  /** London day, YYYY-MM-DD */
  day: string;
  releases: number;
}

interface ReleaseDayBarsProps {
  /** One entry per day, oldest first */
  days: ReleaseDayBarsItem[];
  /** What was released, for the accessible summary ("Data files") */
  label: string;
}

/**
 * One mark per day, filled green when the day had at least one release and
 * an empty outline when it had none: fill as well as colour, so a missed day
 * reads without colour vision. Each mark's tooltip gives the day and its count.
 * The whole is labelled with the totals for screen readers, since ninety
 * separate marks would be noise read out one by one.
 */
export default function ReleaseDayBars({ days, label }: ReleaseDayBarsProps) {
  const withRelease = days.filter(({ releases }) => releases > 0).length;
  const total = days.reduce((sum, { releases }) => sum + releases, 0);

  return (
    <figure className={styles.figure}>
      <div
        className={styles.bars}
        style={{
          gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
        }}
        role="img"
        aria-label={`${label}: a release on ${withRelease} of the last ${days.length} days, ${total} releases in all`}
      >
        {days.map(({ day, releases }) => (
          <span
            key={day}
            className={clsx(styles.day, releases > 0 && styles.released)}
            title={`${formatDateLong(`${day}T12:00:00Z`)}: ${
              releases === 0
                ? "no release"
                : `${releases} ${releases === 1 ? "release" : "releases"}`
            }`}
          />
        ))}
      </div>
      <figcaption className={styles.axis}>
        <span>{days.length} days ago</span>
        <span>
          {withRelease} of {days.length} days with a release
        </span>
        <span>Today</span>
      </figcaption>
    </figure>
  );
}
