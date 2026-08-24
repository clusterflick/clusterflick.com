"use client";

import { Fragment, ReactNode } from "react";
import { Genre, Showing } from "@/types";
import { formatCategory } from "@/app/utils";
import { GENRES } from "@/data/genres";
import { getGenreUrl } from "@/utils/get-genre-url";
import Tag from "@/components/tag";
import styles from "./genres-list.module.css";

// Genre id → landing-page path, for the genres that have a public page
// (excludes the synthetic "Uncategorised" genre).
const GENRE_URL_BY_ID = new Map(
  GENRES.map((genre) => [genre.id, getGenreUrl(genre)]),
);

interface GenresListProps {
  genreIds: string[];
  genres: Record<string, Genre>;
  showings: Record<string, Showing>;
  /** Rendered at the end of the row on desktop, and below the tags once the
   * row is too tight for both — the Watch Trailer button, when there is one.
   * Keeping this a slot rather than a `trailerUrl` prop leaves the button's
   * markup with its callers, who already differ on it (a departed film has no
   * showings to size against). */
  action?: ReactNode;
}

export default function GenresList({
  genreIds,
  genres,
  showings,
  action,
}: GenresListProps) {
  if ((!genreIds || genreIds.length === 0) && !action) {
    return null;
  }

  return (
    <div className={styles.genres}>
      <div className={styles.tags}>
        {genreIds.map((genreId) => {
          const genreName = genres[genreId]?.name;
          const isCategorised = genreName !== "Uncategorised";
          const showingCategories = isCategorised
            ? []
            : [...new Set(Object.values(showings).map((s) => s.category))];
          return (
            <Fragment key={genreId}>
              <Tag color="pink" href={GENRE_URL_BY_ID.get(genreId)}>
                {genreName}
              </Tag>
              {showingCategories.map((category) => (
                <Tag key={category} color="blue">
                  {formatCategory(category)}
                </Tag>
              ))}
            </Fragment>
          );
        })}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
