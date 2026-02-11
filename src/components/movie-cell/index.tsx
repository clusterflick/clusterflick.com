"use client";

import type { CSSProperties } from "react";
import type { Movie } from "@/types";
import Link from "next/link";
import { formatCategory } from "@/app/utils";
import { getPrimaryCategory } from "@/lib/filters";
import { getMovieUrl } from "@/utils/get-movie-url";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import styles from "./movie-cell.module.css";

export default function MovieCell({
  movie,
  style,
  priority,
}: {
  movie: Movie;
  style: CSSProperties;
  priority?: boolean;
}) {
  const href = getMovieUrl(movie);
  const includedMovies = movie.includedMovies;
  const subtitle = movie.year || formatCategory(getPrimaryCategory(movie));

  // Count available posters (main + included movies with posters)
  const includedWithPosters = includedMovies?.filter((m) => m.posterPath) || [];
  const totalPosters = (movie.posterPath ? 1 : 0) + includedWithPosters.length;

  // Only use stacked poster if we have at least 2 posters to show
  const useStackedPoster =
    includedMovies && includedMovies.length > 1 && totalPosters >= 2;

  return (
    <div style={style} role="listitem">
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
        {useStackedPoster ? (
          <StackedPoster
            mainPosterPath={movie.posterPath}
            mainTitle={movie.title}
            includedMovies={includedMovies}
            subtitle={subtitle}
            showOverlay
            priority={priority}
          />
        ) : (
          <MoviePoster
            posterPath={movie.posterPath || includedWithPosters[0]?.posterPath}
            title={movie.title}
            subtitle={subtitle}
            showOverlay
            priority={priority}
          />
        )}
      </Link>
    </div>
  );
}
