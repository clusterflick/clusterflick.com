import Link from "next/link";
import clsx from "clsx";
import { formatDateShort, MS_PER_DAY } from "@/utils/format-date";
import styles from "./festival-timeline.module.css";

export interface FestivalTimelineItem {
  id: string;
  name: string;
  href: string;
  /** First screening in the listings, which may already have passed. */
  dateFrom: number;
  /** Last screening in the listings. */
  dateTo: number;
}

interface FestivalTimelineProps {
  items: FestivalTimelineItem[];
  /** Start of the window: the London midnight the page was built on. */
  start: number;
  /** Drawn in pink, for the festival the page leads with. */
  highlightId?: string;
}

/** Never narrower than this, so a lone weekend doesn't fill the width. */
const MIN_WEEKS = 4;
/** Never wider than this, so a spring festival listing early doesn't squash
    this month's into slivers. */
const MAX_WEEKS = 10;

function dayIndex(time: number, start: number): number {
  return Math.floor((time - start) / MS_PER_DAY);
}

/**
 * The festivals on the page as bars across the coming weeks, so what overlaps
 * and what's next can be seen at once — a list of date ranges makes the reader
 * do that arithmetic. Each name links to the festival's page.
 *
 * The window starts on the day the page was built and runs to the last
 * festival's end, between four and ten weeks. A festival already under way
 * runs off the left edge, one ending later off the right; one starting after
 * the window is left off and a note says so, since the cards below still list
 * it.
 *
 * **When to use:**
 * - The festivals index, above the cards.
 *
 * **When NOT to use:**
 * - Showtimes for a single film or venue — use the venue calendar or planner.
 */
export default function FestivalTimeline({
  items,
  start,
  highlightId,
}: FestivalTimelineProps) {
  const lastDay = Math.max(0, ...items.map((i) => dayIndex(i.dateTo, start)));
  const weeks = Math.min(
    MAX_WEEKS,
    Math.max(MIN_WEEKS, Math.ceil((lastDay + 1) / 7)),
  );
  const totalDays = weeks * 7;

  const rows = items.filter((i) => dayIndex(i.dateFrom, start) < totalDays);
  const later = items.length - rows.length;
  if (rows.length === 0) return null;

  const percent = (days: number) => `${(days / totalDays) * 100}%`;

  return (
    <div className={styles.timeline}>
      <div className={styles.axisRow} aria-hidden="true">
        <span />
        <div className={styles.axis}>
          {Array.from({ length: weeks }, (_, week) => (
            <span
              key={week}
              className={styles.tick}
              style={{ left: percent(week * 7) }}
            >
              {week === 0
                ? "Today"
                : formatDateShort(new Date(start + week * 7 * MS_PER_DAY))}
            </span>
          ))}
        </div>
      </div>
      <ul className={styles.rows}>
        {rows.map((item) => {
          const from = Math.max(0, dayIndex(item.dateFrom, start));
          const to = Math.min(totalDays - 1, dayIndex(item.dateTo, start));
          const fromLabel = formatDateShort(new Date(item.dateFrom));
          const toLabel = formatDateShort(new Date(item.dateTo));
          const dates =
            fromLabel === toLabel ? fromLabel : `${fromLabel} – ${toLabel}`;
          return (
            <li key={item.id} className={styles.row}>
              <Link href={item.href} className={styles.label}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.dates}>{dates}</span>
              </Link>
              <div className={styles.track} aria-hidden="true">
                {Array.from({ length: weeks - 1 }, (_, week) => (
                  <span
                    key={week}
                    className={styles.gridline}
                    style={{ left: percent((week + 1) * 7) }}
                  />
                ))}
                <span
                  className={clsx(
                    styles.bar,
                    item.id === highlightId && styles.highlight,
                    item.dateFrom < start && styles.runsOffStart,
                    dayIndex(item.dateTo, start) >= totalDays &&
                      styles.runsOffEnd,
                  )}
                  style={{
                    left: percent(from),
                    width: percent(to - from + 1),
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {later > 0 && (
        <p className={styles.later}>
          {later === 1
            ? "One more festival starts later and is listed below."
            : `${later} more festivals start later and are listed below.`}
        </p>
      )}
    </div>
  );
}
