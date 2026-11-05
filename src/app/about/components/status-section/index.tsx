"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useIsOnReaderClock, useNow } from "@/hooks/use-now";
import { formatDatePart, formatTimePart } from "@/utils/format-date";
import {
  formatHours,
  getHoursSince,
  STALE_AFTER_HOURS,
} from "@/utils/release-status";
import SourcesPopup from "./sources-popup";
import type { StatusStats } from "./get-status-stats";
import styles from "./status-section.module.css";

// Shows every event on the films page: all categories, all dates, all venues.
const ALL_EVENTS_HREF = "/catalogue?base=all";

interface StatusSectionProps {
  /** Counted at build time by `getStatusStats`. */
  stats: StatusStats;
}

/**
 * The release's figures. Client-side only for the sources popup; the numbers
 * arrive as props, so the static HTML carries them.
 */
export default function StatusSection({ stats }: StatusSectionProps) {
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  // The age is worked out on the reader's clock: counted from the build, it
  // would say "2 hours ago" for as long as the page went unrebuilt. Until
  // then the static HTML gives only the date, which is true at any time.
  const now = useNow(stats.generatedAt);
  const isOnReaderClock = useIsOnReaderClock();
  const hours = getHoursSince(stats.generatedAt, now);
  const isStale = isOnReaderClock && hours >= STALE_AFTER_HOURS;
  const when = (
    <>
      <strong className="nowrap">{formatDatePart(stats.generatedAt)}</strong>{" "}
      <strong className="nowrap">at {formatTimePart(stats.generatedAt)}</strong>
    </>
  );

  const items: Array<{
    label: string;
    value: number;
    /** Renders as "value of total", for a value that is part of a larger set */
    total?: number;
    href?: string;
    onClick?: () => void;
  }> = [
    {
      // "294 of 511 venues" alone read as most of the site being broken; the
      // label says what the first figure counts.
      label: "Venues Listing",
      value: stats.venues.active,
      total: stats.venues.total,
      href: "/venues",
    },
    {
      label: "Event Sources",
      value: stats.sources.length,
      onClick: () => setIsSourcesOpen(true),
    },
    {
      label: "Events",
      value: stats.events,
      href: ALL_EVENTS_HREF,
    },
    {
      label: "Showings",
      value: stats.showings,
      // Every showing, laid out by day: what this figure counts.
      href: "/planner?base=all",
    },
  ];

  return (
    <div className={styles.container}>
      <p
        className={clsx(styles.lastUpdated, isStale && styles.stale)}
        role={isStale ? "alert" : undefined}
      >
        <span className={styles.indicator} aria-hidden="true" />
        <span>
          {isStale ? (
            <>
              No new data for <strong>{formatHours(hours)}</strong>, since{" "}
              {when}.
            </>
          ) : isOnReaderClock ? (
            <>
              Data last refreshed <strong>{formatHours(hours, true)}</strong>,
              on {when}.
            </>
          ) : (
            <>Data last refreshed on {when}.</>
          )}{" "}
          <Link href="/datasets/status" className="nowrap">
            Release history
          </Link>
        </span>
      </p>
      <div className={styles.statsGrid}>
        {items.map((stat) => {
          const content = (
            <>
              <span className={styles.statValue}>
                {stat.value.toLocaleString("en-GB")}
                {stat.total != null && (
                  <span className={styles.statSuffix}>
                    {" "}
                    of {stat.total.toLocaleString("en-GB")}
                  </span>
                )}
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </>
          );

          if (stat.href) {
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className={styles.statCard}
              >
                {content}
              </Link>
            );
          }

          if (stat.onClick) {
            return (
              <button
                key={stat.label}
                type="button"
                onClick={stat.onClick}
                className={styles.statCard}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={stat.label} className={styles.statCard}>
              {content}
            </div>
          );
        })}
      </div>
      <SourcesPopup
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        sources={stats.sources}
      />
    </div>
  );
}
