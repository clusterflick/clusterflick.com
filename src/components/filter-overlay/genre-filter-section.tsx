"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CinemaData, Genre } from "@/types";
import Button from "@/components/button";
import Chip from "@/components/chip";
import styles from "./filter-overlay.module.css";

interface GenreFilterSectionProps {
  movies: CinemaData["movies"];
  genres: Genre[] | null;
  selected: string[] | null;
  toggleGenre: (genreId: string, allGenreIds: string[]) => void;
  selectAllGenres: () => void;
  clearAllGenres: () => void;
}

/** The genre filter's controls, inside its Refine row. */
export default function GenreFilterSection({
  movies,
  genres,
  selected,
  toggleGenre,
  selectAllGenres,
  clearAllGenres,
}: GenreFilterSectionProps) {
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
  const counts = useMemo(() => {
    const counts = new Map<string, number>();
    availableGenres.forEach((genre) => counts.set(genre.id, 0));
    Object.values(movies).forEach((movie) => {
      movie.genres?.forEach((genreId) => {
        counts.set(genreId, (counts.get(genreId) || 0) + 1);
      });
    });
    return counts;
  }, [movies, availableGenres]);

  const allGenreIds = useMemo(
    () => availableGenres.map((g) => g.id),
    [availableGenres],
  );

  const isSelected = (genreId: string) =>
    selected === null || selected.includes(genreId);

  return (
    <div className={styles.advancedFilterGroup}>
      <div className={styles.refineRowLead}>
        <p className={styles.sectionDescription}>
          <Link href="/genres">See a list of all genres</Link>
        </p>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={selectAllGenres}
            disabled={selected === null}
            aria-label="Select all genres"
          >
            Select All
          </Button>
          <span className={styles.controlDivider} aria-hidden="true">
            /
          </span>
          <Button
            variant="link"
            onClick={clearAllGenres}
            disabled={selected !== null && selected.length === 0}
            aria-label="Clear all genres"
          >
            Clear All
          </Button>
        </div>
      </div>
      <div className={styles.chipGroup} role="group" aria-label="Genre filters">
        {availableGenres.map((genre) => (
          <Chip
            key={genre.id}
            type="checkbox"
            name="genre"
            label={genre.name}
            count={counts.get(genre.id)}
            checked={isSelected(genre.id)}
            onChange={() => toggleGenre(genre.id, allGenreIds)}
          />
        ))}
      </div>
    </div>
  );
}
