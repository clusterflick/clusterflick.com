"use client";

import { useEffect, useMemo } from "react";
import { useCinemaData } from "@/state/cinema-data-context";
import { formatDatePart, formatTimePart } from "@/utils/format-date";
import LoadingIndicator from "@/components/loading-indicator";
import styles from "./status-section.module.css";

export default function StatusSection() {
  const { metaData, movies, isLoading, isEmpty, getData } = useCinemaData();

  // Fetch data once on mount - getData is stable but changes identity on re-render,
  // and we intentionally only want this to run once
  useEffect(() => {
    getData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = [
    {
      label: "Venues",
      value: useMemo(
        () => (metaData ? Object.keys(metaData.venues).length : null),
        [metaData],
      ),
    },
    { label: "Event Platforms", value: useMemo(() => 5, []) },
    {
      label: "Events",
      value: useMemo(
        () => (isLoading || isEmpty ? null : Object.keys(movies).length),
        [movies, isLoading, isEmpty],
      ),
    },
    {
      label: "Showings",
      value: useMemo(() => {
        if (isLoading || isEmpty) return null;
        return Object.values(movies).reduce(
          (total, movie) => total + movie.performances.length,
          0,
        );
      }, [movies, isLoading, isEmpty]),
    },
  ];

  return (
    <div className={styles.container}>
      {metaData && (
        <p className={styles.lastUpdated}>
          Data last refreshed on{" "}
          <strong className={styles.nowrap}>
            {formatDatePart(metaData.generatedAt)}
          </strong>{" "}
          <strong className={styles.nowrap}>
            at {formatTimePart(metaData.generatedAt)}
          </strong>
        </p>
      )}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            {stat.value === null ? (
              <LoadingIndicator size="sm" />
            ) : (
              <>
                <span className={styles.statValue}>
                  {stat.value.toLocaleString()}
                </span>
                <span className={styles.statLabel}>{stat.label}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
