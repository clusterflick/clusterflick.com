import Link from "next/link";
import type { Movie } from "@/types";
import { getMovieUrl } from "@/utils/get-movie-url";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import EmptyState from "@/components/empty-state";
import styles from "./film-poster-grid.module.css";

interface FilmPosterGridProps {
  movies: { movie: Movie; performanceCount: number; subtitle?: string }[];
  truncated?: boolean;
  exploreHref?: string;
  exploreLabel?: string;
  showAll?: boolean;
  movieUrlParams?: string;
}

export default function FilmPosterGrid({
  movies,
  truncated,
  exploreHref,
  exploreLabel,
  showAll,
  movieUrlParams,
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
      {exploreHref && exploreLabel && (
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
          {movies.map(({ movie, subtitle }) => {
            const includedMovies = movie.includedMovies;
            const includedWithPosters =
              includedMovies?.filter((m) => m.posterPath) || [];
            const totalPosters =
              (movie.posterPath ? 1 : 0) + includedWithPosters.length;
            const useStackedPoster =
              includedMovies && includedMovies.length > 1 && totalPosters >= 2;
            const posterSubtitle = subtitle ?? movie.year;

            return (
              <Link
                key={movie.id}
                href={`${getMovieUrl(movie)}${movieUrlParams ? `?${movieUrlParams}` : ""}${showAll ? "#show-all" : ""}`}
                className={styles.filmGridLink}
              >
                {useStackedPoster ? (
                  <StackedPoster
                    mainPosterPath={movie.posterPath}
                    mainTitle={movie.title}
                    includedMovies={includedMovies}
                    subtitle={posterSubtitle}
                    showOverlay
                  />
                ) : (
                  <MoviePoster
                    posterPath={
                      movie.posterPath || includedWithPosters[0]?.posterPath
                    }
                    title={movie.title}
                    subtitle={posterSubtitle}
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
