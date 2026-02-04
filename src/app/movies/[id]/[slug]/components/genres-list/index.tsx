"use client";

import { Fragment } from "react";
import { Genre, Showing } from "@/types";
import { formatCategory } from "@/app/utils";
import Tag from "@/components/tag";
import styles from "./genres-list.module.css";

interface GenresListProps {
  genreIds: string[];
  genres: Record<string, Genre>;
  showings: Record<string, Showing>;
}

export default function GenresList({
  genreIds,
  genres,
  showings,
}: GenresListProps) {
  if (!genreIds || genreIds.length === 0) {
    return null;
  }

  return (
    <div className={styles.genres}>
      {genreIds.map((genreId) => {
        const genreName = genres[genreId]?.name;
        const isCategorised = genreName !== "Uncategorised";
        const showingCategories = isCategorised
          ? []
          : [...new Set(Object.values(showings).map((s) => s.category))];
        return (
          <Fragment key={genreId}>
            <Tag color="pink">{genreName}</Tag>
            {showingCategories.map((category) => (
              <Tag key={category} color="blue">
                {formatCategory(category)}
              </Tag>
            ))}
          </Fragment>
        );
      })}
    </div>
  );
}
