import Link from "next/link";
import type { Movie } from "@/types";
import { getMovieUrl } from "@/utils/get-movie-url";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import EmptyState from "@/components/empty-state";
import styles from "./film-poster-grid.module.css";

interface FilmPosterGridProps {
  movies: { movie: Movie; performanceCount: number }[];
  truncated?: boolean;
  exploreHref?: string;
  exploreLabel?: string;
  showAll?: boolean;
}

export default function FilmPosterGrid({
  movies,
  truncated,
  exploreHref,
  exploreLabel = "Start exploring films",
  showAll,
}: FilmPosterGridProps) {
  if (movies.length === 0) {
    return (
      <EmptyState
        icon={{
          src: "/images/icons/neon-ticket-ripped.svg",
          width: 120,
          height: 80,
        }}
        message="No showings currently listed"
        hint="Check back soon — new showings are added regularly"
      />
    );
  }

  return (
    <>
      {exploreHref && (
        <a
          href={exploreHref}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.exploreLink}
        >
          {exploreLabel}
        </a>
      )}
      <div
        className={
          truncated ? styles.filmGridFadeWrapper : styles.filmGridWrapper
        }
      >
        <div className={styles.filmGrid}>
          {movies.map(({ movie }) => {
            const includedMovies = movie.includedMovies;
            const includedWithPosters =
              includedMovies?.filter((m) => m.posterPath) || [];
            const totalPosters =
              (movie.posterPath ? 1 : 0) + includedWithPosters.length;
            const useStackedPoster =
              includedMovies && includedMovies.length > 1 && totalPosters >= 2;

            return (
              <Link
                key={movie.id}
                href={`${getMovieUrl(movie)}${showAll ? "#show-all" : ""}`}
                className={styles.filmGridLink}
              >
                {useStackedPoster ? (
                  <StackedPoster
                    mainPosterPath={movie.posterPath}
                    mainTitle={movie.title}
                    includedMovies={includedMovies}
                    subtitle={movie.year}
                    showOverlay
                  />
                ) : (
                  <MoviePoster
                    posterPath={
                      movie.posterPath || includedWithPosters[0]?.posterPath
                    }
                    title={movie.title}
                    subtitle={movie.year}
                    showOverlay
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
