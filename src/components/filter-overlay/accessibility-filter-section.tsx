"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AccessibilityFeature,
  AccessibilityFilterValue,
  ACCESSIBILITY_NONE,
  CinemaData,
} from "@/types";
import { ACCESSIBILITY_LABELS } from "@/utils/accessibility-labels";
import Button from "@/components/button";
import Chip from "@/components/chip";
import styles from "./filter-overlay.module.css";

/**
 * All accessibility filter options in display order.
 * "None" comes first to represent performances without accessibility features.
 */
const ACCESSIBILITY_OPTIONS: {
  value: AccessibilityFilterValue;
  label: string;
}[] = [
  { value: ACCESSIBILITY_NONE, label: "None" },
  ...Object.values(AccessibilityFeature).map((feature) => ({
    value: feature,
    label: ACCESSIBILITY_LABELS[feature],
  })),
];

interface AccessibilityFilterSectionProps {
  movies: CinemaData["movies"];
  selected: AccessibilityFilterValue[] | null;
  toggleAccessibility: (feature: AccessibilityFilterValue) => void;
  selectAllAccessibility: () => void;
  clearAllAccessibility: () => void;
}

/** The accessibility filter's controls, inside its Refine row. */
export default function AccessibilityFilterSection({
  movies,
  selected,
  toggleAccessibility,
  selectAllAccessibility,
  clearAllAccessibility,
}: AccessibilityFilterSectionProps) {
  // Count movies by accessibility feature (including "None")
  const counts = useMemo(() => {
    const counts = new Map<AccessibilityFilterValue, number>();

    // Initialize all options with 0
    ACCESSIBILITY_OPTIONS.forEach(({ value }) => counts.set(value, 0));

    // Count movies that have at least one performance with each feature
    Object.values(movies).forEach((movie) => {
      const movieFeatures = new Set<AccessibilityFilterValue>();
      let hasPerformanceWithoutFeatures = false;

      movie.performances.forEach((perf) => {
        let perfHasAnyFeature = false;
        if (perf.accessibility) {
          Object.entries(perf.accessibility).forEach(([feature, enabled]) => {
            if (enabled) {
              perfHasAnyFeature = true;
              movieFeatures.add(feature as AccessibilityFeature);
            }
          });
        }
        if (!perfHasAnyFeature) {
          hasPerformanceWithoutFeatures = true;
        }
      });

      if (hasPerformanceWithoutFeatures) {
        movieFeatures.add(ACCESSIBILITY_NONE);
      }

      movieFeatures.forEach((feature) => {
        counts.set(feature, (counts.get(feature) || 0) + 1);
      });
    });

    return counts;
  }, [movies]);

  const isSelected = (value: AccessibilityFilterValue) =>
    selected === null || selected.includes(value);

  return (
    <div className={styles.advancedFilterGroup}>
      <div className={styles.refineRowLead}>
        <p className={styles.sectionDescription}>
          <Link href="/accessibility">
            Learn more about accessible screenings
          </Link>
        </p>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={selectAllAccessibility}
            disabled={selected === null}
            aria-label="Select all accessibility features"
          >
            Select All
          </Button>
          <span className={styles.controlDivider} aria-hidden="true">
            /
          </span>
          <Button
            variant="link"
            onClick={clearAllAccessibility}
            disabled={selected !== null && selected.length === 0}
            aria-label="Clear all accessibility features"
          >
            Clear All
          </Button>
        </div>
      </div>
      <div
        className={styles.chipGroup}
        role="group"
        aria-label="Accessibility feature filters"
      >
        {ACCESSIBILITY_OPTIONS.map(({ value, label }) => (
          <Chip
            key={value}
            type="checkbox"
            name="accessibility"
            label={label}
            count={counts.get(value)}
            checked={isSelected(value)}
            onChange={() => toggleAccessibility(value)}
          />
        ))}
      </div>
    </div>
  );
}
