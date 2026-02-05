import Link from "next/link";
import { IncludedMovie, Movie } from "@/types";
import { getMovieUrl } from "@/utils/get-movie-url";
import { formatDuration } from "@/utils/format-date";
import MoviePoster from "@/components/movie-poster";
import ContentSection from "@/components/content-section";
import styles from "./included-films-section.module.css";

interface IncludedFilmsSectionProps {
  includedMovies: IncludedMovie[];
  /** All movies in the database, to check for standalone entries */
  allMovies: Record<string, Movie>;
  /** If true, renders inline without the Section wrapper (for hero placement) */
  inline?: boolean;
}

export default function IncludedFilmsSection({
  includedMovies,
  allMovies,
  inline = false,
}: IncludedFilmsSectionProps) {
  if (!includedMovies || includedMovies.length === 0) {
    return null;
  }

  const gridClassName = inline
    ? `${styles.filmsGrid} ${styles.filmsGridInline}`
    : styles.filmsGrid;

  const filmsGrid = (
    <div className={gridClassName}>
      {includedMovies.map((movie) => {
        // Check if this movie exists as a standalone entry
        const standaloneMovie = Object.values(allMovies).find(
          (m) => m.imdbId === movie.imdbId && m.imdbId,
        );
        const hasStandalonePage = !!standaloneMovie;

        return (
          <div key={movie.id} className={styles.filmCardWrapper}>
            <div className={styles.filmCard}>
              <div className={styles.posterWrapper}>
                <MoviePoster
                  posterPath={movie.posterPath}
                  title={movie.title}
                  size="small"
                  interactive={false}
                />
                {hasStandalonePage && standaloneMovie && (
                  <Link
                    href={getMovieUrl(standaloneMovie)}
                    className={styles.soloButton}
                  >
                    Watch Film
                  </Link>
                )}
              </div>
              <div className={styles.filmInfo}>
                <h3 className={styles.filmTitle}>{movie.title}</h3>
                <div className={styles.filmMeta}>
                  {movie.year && <span>{movie.year}</span>}
                  {movie.duration && (
                    <span>
                      {formatDuration(movie.duration, { compact: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (inline) {
    return (
      <div className={styles.inlineWrapper}>
        <h3 className={styles.inlineLabel}>Included Films</h3>
        {filmsGrid}
      </div>
    );
  }

  return (
    <ContentSection
      title="Included Films"
      icon={{
        src: "/images/icons/neon-projector.svg",
        width: 36,
        height: 36,
        className: styles.filmIcon,
      }}
    >
      {filmsGrid}
    </ContentSection>
  );
}
