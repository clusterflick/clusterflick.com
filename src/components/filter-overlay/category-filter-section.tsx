"use client";

import { useMemo } from "react";
import { Category, CinemaData } from "@/types";
import { EVENT_CATEGORIES } from "@/state/filter-config-context";
import Button from "@/components/button";
import Chip from "@/components/chip";
import Switch from "@/components/switch";
import styles from "./filter-overlay.module.css";

interface CategoryFilterSectionProps {
  movies: CinemaData["movies"];
  categories: Category[] | null;
  /**
   * The "Hide films I've seen" switch. Absent while signed out: it hides the
   * films on the reader's Seen list, and there is no list without an account.
   */
  hideSeen?: { checked: boolean; onChange: (checked: boolean) => void };
  toggleCategory: (category: Category) => void;
  selectAllCategories: () => void;
  clearAllCategories: () => void;
}

/**
 * Event types — one of the core filters, always in view. Everything else that
 * narrows an event (accessibility, formats, genre, people…) is a Refine row.
 */
export default function CategoryFilterSection({
  movies,
  categories,
  hideSeen,
  toggleCategory,
  selectAllCategories,
  clearAllCategories,
}: CategoryFilterSectionProps) {
  // Count movies by category
  const categoryCounts = useMemo(() => {
    const counts = new Map<Category, number>();

    // Initialize all categories with 0
    EVENT_CATEGORIES.forEach(({ value }) => counts.set(value, 0));

    // Count movies by their showing categories
    Object.values(movies).forEach((movie) => {
      const movieCategories = new Set<Category>();
      // Collect unique categories from all showings
      Object.values(movie.showings).forEach((showing) => {
        movieCategories.add(showing.category);
      });
      // Increment count for each category
      movieCategories.forEach((category) => {
        counts.set(category, (counts.get(category) || 0) + 1);
      });
    });

    return counts;
  }, [movies]);

  const isCategorySelected = (category: Category) =>
    categories === null || categories.includes(category);

  return (
    <section className={styles.section} aria-labelledby="events-heading">
      <div className={styles.sectionHeader}>
        <h3 id="events-heading" className={styles.sectionTitle}>
          Events
        </h3>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={selectAllCategories}
            disabled={categories === null}
            aria-label="Select all event types"
          >
            Select All
          </Button>
          <span className={styles.controlDivider} aria-hidden="true">
            /
          </span>
          <Button
            variant="link"
            onClick={clearAllCategories}
            disabled={categories !== null && categories.length === 0}
            aria-label="Clear all event types"
          >
            Clear All
          </Button>
        </div>
      </div>
      <p className={styles.sectionDescription}>
        Select the types of events you want to see
      </p>
      <div
        className={styles.chipGroup}
        role="group"
        aria-label="Event type filters"
      >
        {EVENT_CATEGORIES.map(({ value, label }) => (
          <Chip
            key={value}
            type="checkbox"
            name="category"
            label={label}
            count={categoryCounts.get(value)}
            checked={isCategorySelected(value)}
            onChange={() => toggleCategory(value)}
          />
        ))}
      </div>
      {hideSeen && (
        <div className={styles.seenSwitch}>
          <Switch
            id="hide-seen"
            label="Hide films I've seen"
            checked={hideSeen.checked}
            onChange={hideSeen.onChange}
          />
        </div>
      )}
    </section>
  );
}
