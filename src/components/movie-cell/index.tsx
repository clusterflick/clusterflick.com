"use client";

import type { Movie } from "@/types";
import Link from "next/link";
import { formatCategory } from "@/app/utils";
import { getPrimaryCategory } from "@/lib/filters";
import { getMovieUrl, SHOW_ALL_HASH } from "@/utils/get-movie-url";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
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
  const includedMovies = movie.includedMovies;
  const subtitle = movie.year || formatCategory(getPrimaryCategory(movie));

  // Count available posters (main + included movies with posters)
  const includedWithPosters = includedMovies?.filter((m) => m.posterPath) || [];
  const totalPosters = (movie.posterPath ? 1 : 0) + includedWithPosters.length;

  // Only use stacked poster if we have at least 2 posters to show
  const useStackedPoster =
    includedMovies && includedMovies.length > 1 && totalPosters >= 2;

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
  );
}
