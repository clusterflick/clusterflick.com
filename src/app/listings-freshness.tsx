"use client";

import clsx from "clsx";
import ReleaseDot from "@/components/release-dot";
import { useIsOnReaderClock, useNow } from "@/hooks/use-now";
import { formatDayAndDate, formatShowingTime } from "@/utils/format-date";
import {
  formatHours,
  getHoursSince,
  STALE_AFTER_HOURS,
} from "@/utils/release-status";
import styles from "./page.module.css";

/**
 * When the listings were last updated, under the home page's figures. Stale
 * past `STALE_AFTER_HOURS` as About's status line is, so the two dots can't
 * disagree. Worked out on the reader's clock: a pipeline that stops also stops
 * the builds, so a page that judged itself at build time would stay green.
 * The static HTML gives only the time, which is true whenever it is read.
 */
export default function ListingsFreshness({
  generatedAt,
}: {
  generatedAt: string;
}) {
  const now = useNow(generatedAt);
  const isOnReaderClock = useIsOnReaderClock();
  const hours = getHoursSince(generatedAt, now);
  const isStale = isOnReaderClock && hours >= STALE_AFTER_HOURS;
  const updatedAt = Date.parse(generatedAt);
  const when = `${formatShowingTime(updatedAt)}, ${formatDayAndDate(updatedAt)}`;

  return (
    <p
      className={clsx(styles.freshness, isStale && styles.freshnessStale)}
      role={isStale ? "alert" : undefined}
    >
      <ReleaseDot stale={isStale} />
      {isStale ? (
        <>
          No new listings for {formatHours(hours)}, since {when}
        </>
      ) : (
        <>Listings updated {when}</>
      )}
    </p>
  );
}
