"use client";

import {
  RATING_GROUPS,
  FilterState,
  RatingFilterId,
  RatingGroupConfig,
} from "@/lib/filters";
import Button from "@/components/button";
import Slider from "@/components/slider";
import styles from "./filter-overlay.module.css";

interface RatingFilterSectionProps {
  /** Current minimum per source; `null` means no filter. */
  selected: Pick<FilterState, RatingFilterId>;
  setRating: (filterId: RatingFilterId, min: number | null) => void;
}

/**
 * The rating filters: one slider per source, since the sources don't share a
 * scale (see RATING_GROUPS). Grouped under one heading because together they
 * are one idea — how well a film is thought of — and three headings would
 * give ratings more of the overlay than genre gets.
 */
export default function RatingFilterSection({
  selected,
  setRating,
}: RatingFilterSectionProps) {
  const anySet = RATING_GROUPS.some(
    (group) => selected[group.filterId] !== null,
  );

  return (
    <div className={styles.advancedFilterGroup}>
      <div className={styles.advancedFilterHeader}>
        <h4 className={styles.advancedFilterTitle}>Ratings</h4>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={() =>
              RATING_GROUPS.forEach((group) => setRating(group.filterId, null))
            }
            disabled={!anySet}
            aria-label="Clear all rating filters"
          >
            Clear All
          </Button>
        </div>
      </div>

      {RATING_GROUPS.map((group) => (
        <RatingSlider
          key={group.filterId}
          group={group}
          value={selected[group.filterId]}
          setRating={setRating}
        />
      ))}
    </div>
  );
}

function RatingSlider({
  group,
  value,
  setRating,
}: {
  group: RatingGroupConfig;
  value: number | null;
  setRating: (filterId: RatingFilterId, min: number | null) => void;
}) {
  // The slider's lowest position, one step below the lowest threshold, reads
  // as "Any rating" and clears the filter. A slider has no off switch, and a
  // separate one beside it would be two controls for one setting.
  const anyPosition = group.min - group.step;
  // Compared with a tolerance: steps of 0.1 are not exact in binary.
  const isAny = (position: number) => position < group.min - group.step / 2;
  const factor = 10 ** group.decimals;

  return (
    <div className={styles.ratingSlider}>
      <Slider
        id={`${group.filterId}-slider`}
        label={group.source}
        min={anyPosition}
        max={group.max}
        step={group.step}
        value={value ?? anyPosition}
        onChange={(next) =>
          setRating(
            group.filterId,
            isAny(next) ? null : Math.round(next * factor) / factor,
          )
        }
        formatValue={(position) =>
          isAny(position)
            ? "Any rating"
            : `${group.formatMin(Math.round(position * factor) / factor)} ${group.scale}`
        }
      />
      <p className={styles.ratingNote}>
        Only films with {group.minReviews.toLocaleString("en-GB")}+{" "}
        {group.reviewNoun} are counted
      </p>
    </div>
  );
}
