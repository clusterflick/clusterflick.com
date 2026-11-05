"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDatePart, formatTimePart } from "@/utils/format-date";
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
    },
  ];

  return (
    <div className={styles.container}>
      <p className={styles.lastUpdated}>
        Data last refreshed on{" "}
        <strong className="nowrap">{formatDatePart(stats.generatedAt)}</strong>{" "}
        <strong className="nowrap">
          at {formatTimePart(stats.generatedAt)}
        </strong>
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
