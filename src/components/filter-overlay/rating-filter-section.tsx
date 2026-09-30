"use client";

import {
  LETTERBOXD_RATING_MIN,
  LETTERBOXD_RATING_MAX,
  LETTERBOXD_RATING_STEP,
} from "@/lib/filters";
import { LETTERBOXD_MIN_REVIEWS } from "@/utils/movie-ratings.mjs";
import Button from "@/components/button";
import Slider from "@/components/slider";
import styles from "./filter-overlay.module.css";

/**
 * The slider's lowest position, one step below the lowest threshold, which
 * reads as "Any rating" and clears the filter. A slider has no off switch, and
 * a separate one beside it would be two controls for one setting.
 */
const ANY_POSITION = LETTERBOXD_RATING_MIN - LETTERBOXD_RATING_STEP;

interface RatingFilterSectionProps {
  /** Current minimum; `null` means no filter. */
  value: number | null;
  setLetterboxdRating: (min: number | null) => void;
}

/**
 * The Letterboxd rating filter: a minimum average, set on a slider in steps
 * of 0.1, since averages bunch between 3.5 and 4.3 and half-point steps jump
 * straight across the useful range. The note says which films can be rated at
 * all, so an unrated favourite dropping out doesn't read as a judgement on it.
 */
export default function RatingFilterSection({
  value,
  setLetterboxdRating,
}: RatingFilterSectionProps) {
  return (
    <div className={styles.advancedFilterGroup}>
      <div className={styles.advancedFilterHeader}>
        <h4 className={styles.advancedFilterTitle}>Letterboxd Rating</h4>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={() => setLetterboxdRating(null)}
            disabled={value === null}
            aria-label="Clear the rating filter"
          >
            Clear
          </Button>
        </div>
      </div>

      <Slider
        id="letterboxd-rating"
        label="Minimum average"
        min={ANY_POSITION}
        max={LETTERBOXD_RATING_MAX}
        step={LETTERBOXD_RATING_STEP}
        value={value ?? ANY_POSITION}
        onChange={(next) =>
          // Compared with a tolerance: steps of 0.1 are not exact in binary.
          setLetterboxdRating(
            next < LETTERBOXD_RATING_MIN - LETTERBOXD_RATING_STEP / 2
              ? null
              : Math.round(next * 10) / 10,
          )
        }
        formatValue={(position) =>
          position < LETTERBOXD_RATING_MIN - LETTERBOXD_RATING_STEP / 2
            ? "Any rating"
            : `${position.toFixed(1)}+ out of 5`
        }
      />

      <p className={styles.selectionNote}>
        Only films with {LETTERBOXD_MIN_REVIEWS.toLocaleString("en-GB")}+
        reviews are counted
      </p>
    </div>
  );
}
