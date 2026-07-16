"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCinemaData } from "@/state/cinema-data-context";
import { formatDatePart, formatTimePart } from "@/utils/format-date";
import LoadingIndicator from "@/components/loading-indicator";
import SourcesPopup from "./sources-popup";
import styles from "./status-section.module.css";

// Shows every event on the films page: all categories, all dates, all venues.
const ALL_EVENTS_HREF = "/films?base=all";

export default function StatusSection() {
  const { metaData, movies, isLoading, isEmpty, getData } = useCinemaData();
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  // Fetch data once on mount - getData is stable but changes identity on re-render,
  // and we intentionally only want this to run once
  useEffect(() => {
    getData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const venueCount = useMemo(
    () => (metaData ? Object.keys(metaData.venues).length : null),
    [metaData],
  );

  const externalSources = useMemo(() => {
    if (isLoading || isEmpty || !metaData) return null;

    const venueIds = Object.keys(metaData.venues);
    const showingCounts = new Map<string, number>();

    for (const movie of Object.values(movies)) {
      for (const showingId of Object.keys(movie.showings)) {
        // Showings scraped from venue sites have IDs starting with {venueId}-
        if (venueIds.some((id) => showingId.startsWith(`${id}-`))) {
          continue;
        }

        // Extract the source domain from external showing IDs
        // Format: {sourceDomain}-{eventSpecificId}
        const match = showingId.match(/^(.+\.[a-z]{2,})-/);
        if (match) {
          const source = match[1];
          showingCounts.set(source, (showingCounts.get(source) ?? 0) + 1);
        }
      }
    }

    return [...showingCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => a.source.localeCompare(b.source));
  }, [metaData, movies, isLoading, isEmpty]);

  const eventCount = useMemo(
    () => (isLoading || isEmpty ? null : Object.keys(movies).length),
    [movies, isLoading, isEmpty],
  );

  const showingCount = useMemo(() => {
    if (isLoading || isEmpty) return null;
    return Object.values(movies).reduce(
      (total, movie) => total + movie.performances.length,
      0,
    );
  }, [movies, isLoading, isEmpty]);

  const stats: Array<{
    label: string;
    value: number | null;
    href?: string;
    onClick?: () => void;
  }> = [
    {
      label: "Venues",
      value: venueCount,
      href: "/venues",
    },
    {
      label: "Event Sources",
      value: externalSources ? externalSources.length : null,
      onClick: externalSources ? () => setIsSourcesOpen(true) : undefined,
    },
    {
      label: "Events",
      value: eventCount,
      href: ALL_EVENTS_HREF,
    },
    {
      label: "Showings",
      value: showingCount,
    },
  ];

  return (
    <div className={styles.container}>
      {metaData && (
        <p className={styles.lastUpdated}>
          Data last refreshed on{" "}
          <strong className="nowrap">
            {formatDatePart(metaData.generatedAt)}
          </strong>{" "}
          <strong className="nowrap">
            at {formatTimePart(metaData.generatedAt)}
          </strong>
        </p>
      )}
      <div className={styles.statsGrid}>
        {stats.map((stat) => {
          const content =
            stat.value === null ? (
              <LoadingIndicator size="sm" />
            ) : (
              <>
                <span className={styles.statValue}>
                  {stat.value.toLocaleString("en-GB")}
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
        sources={externalSources ?? []}
      />
    </div>
  );
}
