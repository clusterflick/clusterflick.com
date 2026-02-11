"use client";

import { useMemo } from "react";
import { Category, CinemaData, Genre } from "@/types";
import { EVENT_CATEGORIES } from "@/state/filter-config-context";
import Button from "@/components/button";
import Chip from "@/components/chip";
import ExpandableSection from "@/components/expandable-section";
import styles from "./filter-overlay.module.css";

interface CategoryFilterSectionProps {
  movies: CinemaData["movies"];
  genres: Genre[] | null;
  filterState: {
    categories: Category[] | null;
    genres: string[] | null;
  };
  toggleCategory: (category: Category) => void;
  selectAllCategories: () => void;
  clearAllCategories: () => void;
  toggleGenre: (genreId: string, allGenreIds: string[]) => void;
  selectAllGenres: () => void;
  clearAllGenres: () => void;
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

  const allGenresSelected = filterState.genres === null;
  const noGenresSelected =
    filterState.genres !== null && filterState.genres.length === 0;

  const allCategoriesSelected = filterState.categories === null;
  const noCategoriesSelected =
    filterState.categories !== null && filterState.categories.length === 0;

  return (
    <section className={styles.section} aria-labelledby="events-heading">
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderText}>
          <h3 id="events-heading" className={styles.sectionTitle}>
            Events
          </h3>
          <p className={styles.sectionDescription}>
            Select the types of events you want to see
          </p>
        </div>
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
      <div
        className={styles.chipGroup}
        role="group"
        aria-label="Event type filters"
      >
        {EVENT_CATEGORIES.map(({ value, label }) => (
          <Chip
            key={value}
            type="checkbox"
            label={label}
            count={categoryCounts.get(value)}
            checked={isCategorySelected(value)}
            onChange={() => toggleCategory(value)}
          />
        ))}
      </div>
      <ExpandableSection title="More Event Options">
        <div className={styles.advancedFilters}>
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
            <div className={styles.chipGroup} role="group">
              {availableGenres.map((genre) => (
                <Chip
                  key={genre.id}
                  type="checkbox"
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
