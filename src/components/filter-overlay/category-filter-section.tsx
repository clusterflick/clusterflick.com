"use client";

import { useMemo } from "react";
import {
  AccessibilityFeature,
  AccessibilityFilterValue,
  ACCESSIBILITY_NONE,
  Category,
  CinemaData,
  Genre,
} from "@/types";
import { ACCESSIBILITY_LABELS } from "@/utils/accessibility-labels";
import {
  FORMAT_GROUPS,
  FormatFilterId,
  getEffectiveFormatValue,
} from "@/lib/filters";
import { EVENT_CATEGORIES } from "@/state/filter-config-context";
import Link from "next/link";
import Button from "@/components/button";
import Chip from "@/components/chip";
import ExpandableSection from "@/components/expandable-section";
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

interface CategoryFilterSectionProps {
  movies: CinemaData["movies"];
  genres: Genre[] | null;
  filterState: {
    categories: Category[] | null;
    genres: string[] | null;
    accessibility: AccessibilityFilterValue[] | null;
    formats: Record<FormatFilterId, string[] | null>;
  };
  toggleCategory: (category: Category) => void;
  selectAllCategories: () => void;
  clearAllCategories: () => void;
  toggleGenre: (genreId: string, allGenreIds: string[]) => void;
  selectAllGenres: () => void;
  clearAllGenres: () => void;
  toggleAccessibility: (feature: AccessibilityFilterValue) => void;
  selectAllAccessibility: () => void;
  clearAllAccessibility: () => void;
  toggleFormat: (
    filterId: FormatFilterId,
    value: string,
    allValues: string[],
  ) => void;
  selectAllFormat: (filterId: FormatFilterId) => void;
  clearAllFormat: (filterId: FormatFilterId) => void;
}

export default function CategoryFilterSection({
  movies,
  genres,
  filterState,
  toggleCategory,
  selectAllCategories,
  clearAllCategories,
  toggleGenre,
  selectAllGenres,
  clearAllGenres,
  toggleAccessibility,
  selectAllAccessibility,
  clearAllAccessibility,
  toggleFormat,
  selectAllFormat,
  clearAllFormat,
}: CategoryFilterSectionProps) {
  // Count movies by category
  const categoryCounts = useMemo(() => {
    const counts = new Map<Category, number>();

    // Initialize all categories with 0
    EVENT_CATEGORIES.forEach(({ value }) => counts.set(value, 0));

    // Count movies by their showing categories
    Object.values(movies).forEach((movie) => {
      const categories = new Set<Category>();
      // Collect unique categories from all showings
      Object.values(movie.showings).forEach((showing) => {
        categories.add(showing.category);
      });
      // Increment count for each category
      categories.forEach((category) => {
        counts.set(category, (counts.get(category) || 0) + 1);
      });
    });

    return counts;
  }, [movies]);

  // Get available genres, with "Uncategorised" first
  const availableGenres = useMemo(() => {
    if (!genres) return [];
    return [...genres].sort((a, b) => {
      // Put "Uncategorised" first
      if (a.name === "Uncategorised") return -1;
      if (b.name === "Uncategorised") return 1;
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [genres]);

  // Count movies by genre
  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();

    // Initialize all genres with 0
    availableGenres.forEach((genre) => counts.set(genre.id, 0));

    // Count movies by their genres
    Object.values(movies).forEach((movie) => {
      movie.genres?.forEach((genreId) => {
        counts.set(genreId, (counts.get(genreId) || 0) + 1);
      });
    });

    return counts;
  }, [movies, availableGenres]);

  // All genre IDs
  const allGenreIds = useMemo(() => {
    return availableGenres.map((g) => g.id);
  }, [availableGenres]);

  // Helper to check if a genre is selected
  const isGenreSelected = (genreId: string) => {
    if (filterState.genres === null) return true;
    return filterState.genres.includes(genreId);
  };

  // Helper to check if a category is selected
  const isCategorySelected = (category: Category) => {
    if (filterState.categories === null) return true;
    return filterState.categories.includes(category);
  };

  // Count movies by accessibility feature (including "None")
  const accessibilityCounts = useMemo(() => {
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

  // Helper to check if an accessibility option is selected
  const isAccessibilitySelected = (value: AccessibilityFilterValue) => {
    if (filterState.accessibility === null) return true;
    return filterState.accessibility.includes(value);
  };

  // Count movies by format value, per group. A movie is counted for a value if
  // any of its performances resolves to that value (absent field = default).
  const formatCounts = useMemo(() => {
    const counts: Record<FormatFilterId, Map<string, number>> = {} as Record<
      FormatFilterId,
      Map<string, number>
    >;
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

  // Helper to check if a format value is selected within its group
  const isFormatSelected = (filterId: FormatFilterId, value: string) => {
    const selected = filterState.formats[filterId];
    if (selected === null) return true;
    return selected.includes(value);
  };

  const allGenresSelected = filterState.genres === null;
  const noGenresSelected =
    filterState.genres !== null && filterState.genres.length === 0;

  const allAccessibilitySelected = filterState.accessibility === null;
  const noAccessibilitySelected =
    filterState.accessibility !== null &&
    filterState.accessibility.length === 0;

  const allCategoriesSelected = filterState.categories === null;
  const noCategoriesSelected =
    filterState.categories !== null && filterState.categories.length === 0;

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
            disabled={allCategoriesSelected}
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
            disabled={noCategoriesSelected}
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
      {/* Accessibility Filter */}
      <div className={styles.advancedFilterGroup}>
        <div className={styles.advancedFilterHeader}>
          <h4 className={styles.advancedFilterTitle}>Accessibility</h4>
          <div className={styles.selectionControls}>
            <Button
              variant="link"
              onClick={selectAllAccessibility}
              disabled={allAccessibilitySelected}
            >
              Select All
            </Button>
            <span className={styles.controlDivider}>/</span>
            <Button
              variant="link"
              onClick={clearAllAccessibility}
              disabled={noAccessibilitySelected}
            >
              Clear All
            </Button>
          </div>
        </div>
        <p className={styles.sectionDescription}>
          <Link href="/accessibility" className={styles.sectionLink}>
            Learn more about accessible screenings
          </Link>
        </p>
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
              count={accessibilityCounts.get(value)}
              checked={isAccessibilitySelected(value)}
              onChange={() => toggleAccessibility(value)}
            />
          ))}
        </div>
      </div>
      <ExpandableSection title="More Event Options">
        <div className={styles.advancedFilters}>
          {/* Format Filters — Source / Presentation / Dimension */}
          {FORMAT_GROUPS.map((group) => {
            const selected = filterState.formats[group.filterId];
            const allValues = group.options.map((o) => o.value);
            const allSelected = selected === null;
            const noneSelected = selected !== null && selected.length === 0;
            return (
              <div className={styles.advancedFilterGroup} key={group.filterId}>
                <div className={styles.advancedFilterHeader}>
                  <h4 className={styles.advancedFilterTitle}>{group.title}</h4>
                  <div className={styles.selectionControls}>
                    <Button
                      variant="link"
                      onClick={() => selectAllFormat(group.filterId)}
                      disabled={allSelected}
                      aria-label={`Select all ${group.title} options`}
                    >
                      Select All
                    </Button>
                    <span className={styles.controlDivider}>/</span>
                    <Button
                      variant="link"
                      onClick={() => clearAllFormat(group.filterId)}
                      disabled={noneSelected}
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
                      count={formatCounts[group.filterId].get(option.value)}
                      checked={isFormatSelected(group.filterId, option.value)}
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
            <Link href="/formats" className={styles.sectionLink}>
              See a list of all formats
            </Link>
          </p>
          {/* Genre Filter */}
          <div className={styles.advancedFilterGroup}>
            <div className={styles.advancedFilterHeader}>
              <h4 className={styles.advancedFilterTitle}>Genre</h4>
              <div className={styles.selectionControls}>
                <Button
                  variant="link"
                  onClick={selectAllGenres}
                  disabled={allGenresSelected}
                  aria-label="Select all genres"
                >
                  Select All
                </Button>
                <span className={styles.controlDivider}>/</span>
                <Button
                  variant="link"
                  onClick={clearAllGenres}
                  disabled={noGenresSelected}
                  aria-label="Clear all genres"
                >
                  Clear All
                </Button>
              </div>
            </div>
            <p className={styles.sectionDescription}>
              <Link href="/genres" className={styles.sectionLink}>
                See a list of all genres
              </Link>
            </p>
            <div className={styles.chipGroup} role="group">
              {availableGenres.map((genre) => (
                <Chip
                  key={genre.id}
                  type="checkbox"
                  name="genre"
                  label={genre.name}
                  count={genreCounts.get(genre.id)}
                  checked={isGenreSelected(genre.id)}
                  onChange={() => toggleGenre(genre.id, allGenreIds)}
                />
              ))}
            </div>
          </div>
        </div>
      </ExpandableSection>
    </section>
  );
}
