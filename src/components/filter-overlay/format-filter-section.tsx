"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CinemaData } from "@/types";
import {
  FORMAT_GROUPS,
  FormatFilterId,
  getEffectiveFormatValue,
} from "@/lib/filters";
import Button from "@/components/button";
import Chip from "@/components/chip";
import styles from "./filter-overlay.module.css";

interface FormatFilterSectionProps {
  movies: CinemaData["movies"];
  selected: Record<FormatFilterId, string[] | null>;
  toggleFormat: (
    filterId: FormatFilterId,
    value: string,
    allValues: string[],
  ) => void;
  selectAllFormat: (filterId: FormatFilterId) => void;
  clearAllFormat: (filterId: FormatFilterId) => void;
}

/**
 * The format filters — source, presentation and dimension — inside one Refine
 * row, since together they answer one question: how the film is shown.
 */
export default function FormatFilterSection({
  movies,
  selected,
  toggleFormat,
  selectAllFormat,
  clearAllFormat,
}: FormatFilterSectionProps) {
  // Count movies by format value, per group. A movie is counted for a value if
  // any of its performances resolves to that value (absent field = default).
  const counts = useMemo(() => {
    const counts = {} as Record<FormatFilterId, Map<string, number>>;
    FORMAT_GROUPS.forEach((group) => {
      counts[group.filterId] = new Map(
        group.options.map(({ value }) => [value, 0]),
      );
    });

    Object.values(movies).forEach((movie) => {
      FORMAT_GROUPS.forEach((group) => {
        const valuesInMovie = new Set<string>();
        movie.performances.forEach((perf) => {
          valuesInMovie.add(
            getEffectiveFormatValue(perf, group.key, group.defaultValue),
          );
        });
        const groupCounts = counts[group.filterId];
        valuesInMovie.forEach((value) => {
          groupCounts.set(value, (groupCounts.get(value) || 0) + 1);
        });
      });
    });

    return counts;
  }, [movies]);

  return (
    <div className={styles.advancedFilters}>
      {FORMAT_GROUPS.map((group) => {
        const chosen = selected[group.filterId];
        const allValues = group.options.map((o) => o.value);
        return (
          <div className={styles.advancedFilterGroup} key={group.filterId}>
            <div className={styles.advancedFilterHeader}>
              <h5 className={styles.advancedFilterTitle}>{group.title}</h5>
              <div className={styles.selectionControls}>
                <Button
                  variant="link"
                  onClick={() => selectAllFormat(group.filterId)}
                  disabled={chosen === null}
                  aria-label={`Select all ${group.title} options`}
                >
                  Select All
                </Button>
                <span className={styles.controlDivider} aria-hidden="true">
                  /
                </span>
                <Button
                  variant="link"
                  onClick={() => clearAllFormat(group.filterId)}
                  disabled={chosen !== null && chosen.length === 0}
                  aria-label={`Clear all ${group.title} options`}
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div
              className={styles.chipGroup}
              role="group"
              aria-label={`${group.title} filters`}
            >
              {group.options.map((option) => (
                <Chip
                  key={option.value}
                  type="checkbox"
                  name={group.filterId}
                  label={option.label}
                  count={counts[group.filterId].get(option.value)}
                  checked={chosen === null || chosen.includes(option.value)}
                  onChange={() =>
                    toggleFormat(group.filterId, option.value, allValues)
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
      <p className={styles.sectionDescription}>
        <Link href="/formats">See a list of all formats</Link>
      </p>
    </div>
  );
}
