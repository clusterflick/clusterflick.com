"use client";

import type { Movie } from "@/types";
import Link from "next/link";
import { formatCategory } from "@/app/utils";
import { getPrimaryCategory } from "@/lib/filters";
import { getMovieUrl, SHOW_ALL_HASH } from "@/utils/get-movie-url";
import EventPoster from "@/components/event-poster";
import styles from "./movie-cell.module.css";

export default function MovieCell({
  movie,
  priority,
  showAll,
}: {
  movie: Movie;
  priority?: boolean;
  /**
   * Open the movie page with every performance listed, ignoring the reader's
   * active filters. Use where the grid is itself the selection (a film list),
   * so a filtered-out screening still shows on arrival.
   */
  showAll?: boolean;
}) {
  const href = `${getMovieUrl(movie)}${showAll ? SHOW_ALL_HASH : ""}`;
  const subtitle = movie.year || formatCategory(getPrimaryCategory(movie));

  return (
    <Link
      href={href}
      className={styles.movieLink}
      onClick={() => {
        try {
          sessionStorage.setItem("useBrowserBack", "true");
        } catch {
          // Ignore - UX optimization only
        }
      }}
    >
      <EventPoster
        title={movie.title}
        posterPath={movie.posterPath}
        includedMovies={movie.includedMovies}
        subtitle={subtitle}
        showOverlay
        priority={priority}
      />
    </Link>
  );
}
