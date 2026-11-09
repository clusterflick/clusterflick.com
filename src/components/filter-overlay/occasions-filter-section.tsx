"use client";

import { useMemo } from "react";
import {
  CinemaData,
  OccasionFilterValue,
  OccasionType,
  OCCASION_NONE,
} from "@/types";
import { OCCASION_LABELS } from "@/utils/occasion-labels";
import { OCCASION_ORDER } from "@/lib/occasions/rules";
import Button from "@/components/button";
import Chip from "@/components/chip";
import styles from "./filter-overlay.module.css";

/**
 * Every kind of occasion, one pill each, with "None" first for ordinary
 * screenings - the accessibility row's layout. The kinds aren't grouped: a
 * reader looking for a panel is told how many panels there are.
 */
const OCCASION_OPTIONS: { value: OccasionFilterValue; label: string }[] = [
  { value: OCCASION_NONE, label: "None" },
  ...OCCASION_ORDER.map((kind: OccasionType) => ({
    value: kind,
    label: OCCASION_LABELS[kind],
  })),
];

interface OccasionsFilterSectionProps {
  movies: CinemaData["movies"];
  selected: OccasionFilterValue[] | null;
  toggleOccasion: (value: OccasionFilterValue) => void;
  selectAllOccasions: () => void;
  clearAllOccasions: () => void;
}

/** The occasions filter's controls, inside its Refine row. */
export default function OccasionsFilterSection({
  movies,
  selected,
  toggleOccasion,
  selectAllOccasions,
  clearAllOccasions,
}: OccasionsFilterSectionProps) {
  // Films with at least one performance of each kind, as accessibility counts
  const counts = useMemo(() => {
    const counts = new Map<OccasionFilterValue, number>(
      OCCASION_OPTIONS.map(({ value }) => [value, 0]),
    );
    for (const movie of Object.values(movies)) {
      const kinds = new Set<OccasionFilterValue>();
      for (const performance of movie.performances) {
        const present = Object.entries(performance.occasions ?? {})
          .filter(([, value]) => !!value)
          .map(([kind]) => kind as OccasionType);
        if (present.length === 0) kinds.add(OCCASION_NONE);
        present.forEach((kind) => kinds.add(kind));
      }
      kinds.forEach((kind) => counts.set(kind, (counts.get(kind) ?? 0) + 1));
    }
    return counts;
  }, [movies]);

  const isSelected = (value: OccasionFilterValue) =>
    selected === null || selected.includes(value);

  return (
    <div className={styles.advancedFilterGroup}>
      <div className={styles.refineRowLead}>
        <p className={styles.sectionDescription}>
          Q&amp;As, introductions, live scores and premieres, as the venue
          billed them.
        </p>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={selectAllOccasions}
            disabled={selected === null}
            aria-label="Select all occasions"
          >
            Select All
          </Button>
          <span className={styles.controlDivider} aria-hidden="true">
            /
          </span>
          <Button
            variant="link"
            onClick={clearAllOccasions}
            disabled={selected !== null && selected.length === 0}
            aria-label="Clear all occasions"
          >
            Clear All
          </Button>
        </div>
      </div>
      <div
        className={styles.chipGroup}
        role="group"
        aria-label="Occasion filters"
      >
        {OCCASION_OPTIONS.map(({ value, label }) => (
          <Chip
            key={value}
            type="checkbox"
            name="occasions"
            label={label}
            count={counts.get(value)}
            checked={isSelected(value)}
            onChange={() => toggleOccasion(value)}
          />
        ))}
      </div>
    </div>
  );
}
