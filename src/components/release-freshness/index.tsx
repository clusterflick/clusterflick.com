"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useNow } from "@/hooks/use-now";
import { formatShowingTime, formatDateLong } from "@/utils/format-date";
import {
  getHoursSince,
  STALE_AFTER_HOURS,
  type ReleaseRef,
} from "@/utils/release-status";
import styles from "./release-freshness.module.css";

export interface ReleaseFreshnessProps {
  /** The newest release the page was built with */
  latest: ReleaseRef;
  /** When the page was built: the clock the static HTML is rendered against */
  builtAt: string;
  /**
   * Where to check for anything newer once the page has loaded. Off in
   * stories, which have no published data to read.
   */
  latestUrl?: string | null;
}

interface LatestJson {
  releases?: Record<string, ReleaseRef | null>;
}

/**
 * How long ago the newest dataset release was, worked out in the reader's
 * browser rather than at build time. A page built from a pipeline that has
 * since stopped would otherwise go on saying "2 hours ago" forever. Past
 * `STALE_AFTER_HOURS` it turns into a warning.
 *
 * It renders against the build time first, so the static HTML matches the
 * first client render, then moves to the reader's clock and asks latest.json
 * whether anything newer has been released since the page was built.
 */
export default function ReleaseFreshness({
  latest: built,
  builtAt,
  latestUrl = "/datasets/latest.json",
}: ReleaseFreshnessProps) {
  const now = useNow(builtAt);
  const [published, setPublished] = useState<ReleaseRef | null>(null);

  useEffect(() => {
    if (!latestUrl) return;
    let cancelled = false;
    fetch(latestUrl)
      .then((response) => (response.ok ? response.json() : null))
      .then((json: LatestJson | null) => {
        if (cancelled || !json?.releases) return;
        const newest = Object.values(json.releases)
          .filter((release): release is ReleaseRef => !!release?.publishedAt)
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
        if (newest) setPublished(newest);
      })
      // The build's own figure stands; it can only be older, never wrong
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [latestUrl]);

  // latest.json can only be newer than the build, unless it's a cached copy
  // from before it
  const latest =
    published && published.publishedAt > built.publishedAt ? published : built;

  const hours = getHoursSince(latest.publishedAt, now);
  const isStale = hours >= STALE_AFTER_HOURS;
  const when = `${formatDateLong(latest.publishedAt)} at ${formatShowingTime(
    new Date(latest.publishedAt).getTime(),
  )}`;

  return (
    <p
      className={clsx(styles.freshness, isStale && styles.stale)}
      role={isStale ? "alert" : undefined}
    >
      <span className={styles.indicator} aria-hidden="true" />
      {isStale ? (
        <span>
          <strong>No new data for {formatHours(hours)}.</strong> The last
          release was on {when}. Releases have come several times a day, so the
          pipeline has most likely stopped.
        </span>
      ) : (
        <span>
          Last new data <strong>{formatHours(hours, true)}</strong>, release{" "}
          <code>{latest.tag}</code> on {when}.
        </span>
      )}
    </p>
  );
}

function formatHours(hours: number, asAgo = false): string {
  if (hours < 1) return asAgo ? "less than an hour ago" : "less than an hour";
  const span =
    hours < 48
      ? `${hours} ${hours === 1 ? "hour" : "hours"}`
      : `${Math.floor(hours / 24)} days`;
  return asAgo ? `${span} ago` : span;
}
