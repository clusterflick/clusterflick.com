import { Movie } from "@clusterflick/catalogue/types";
import { getIncludedListings } from "@clusterflick/catalogue/utils/get-included-listings";
import { getMovieUrl } from "@clusterflick/catalogue/utils/get-movie-url";
import { formatDuration } from "@clusterflick/catalogue/utils/format-date";
import { ButtonLink } from "@/components/button";
import MoviePoster from "@/components/movie-poster";
import ListProgress from "@/components/list-progress";
import PosterStatusMarkers from "@/components/poster-status-markers";
import ContentSection from "@/components/content-section";
import styles from "./included-films-section.module.css";

interface IncludedFilmsSectionProps {
  /** The event whose films these are */
  event: Pick<Movie, "id" | "includedMovies">;
  /** All movies in the database, to find each film's own listing */
  allMovies: Record<string, Movie>;
  /** If true, renders inline without the Section wrapper (for hero placement) */
  inline?: boolean;
}

export default function IncludedFilmsSection({
  event,
  allMovies,
  inline = false,
}: IncludedFilmsSectionProps) {
  const includedListings = getIncludedListings(event, allMovies);
  if (includedListings.length === 0) {
    return null;
  }

  const gridClassName = inline
    ? `${styles.filmsGrid} ${styles.filmsGridInline}`
    : styles.filmsGrid;

  // How many of the event's films the reader has seen, beside the heading.
  // Each poster's own markers say which, and which are on their watchlist.
  const progress = (
    <ListProgress tmdbIds={includedListings.map(({ film }) => film.id)} />
  );

  const filmsGrid = (
    <div className={gridClassName}>
      {includedListings.map(({ film: movie, listing: standaloneMovie }) => {
        return (
          <div key={movie.id} className={styles.filmCardWrapper}>
            <div className={styles.filmCard}>
              <div className={styles.posterWrapper}>
                {/* First, as the direct child of the wrapper: hovering it is
                    what fans a stack of markers out */}
                <PosterStatusMarkers movieId={movie.id} />
                <MoviePoster
                  posterPath={movie.posterPath}
                  title={movie.title}
                  size="small"
                  interactive={false}
                />
                {standaloneMovie && (
                  <ButtonLink
                    href={getMovieUrl(standaloneMovie)}
                    size="sm"
                    className={styles.soloButton}
                  >
                    Single Showing
                  </ButtonLink>
                )}
              </div>
              <div className={styles.filmInfo}>
                <h3 className={styles.filmTitle}>{movie.title}</h3>
                <div className={styles.filmMeta}>
                  {movie.year ? <span>{movie.year}</span> : null}
                  {movie.duration ? (
                    <span>
                      {formatDuration(movie.duration, { compact: true })}
                    </span>
                  ) : null}
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
        <div className={styles.inlineHeader}>
          <h3 className={styles.inlineLabel}>Included Films</h3>
          {progress}
        </div>
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
      <div className={styles.progress}>{progress}</div>
      {filmsGrid}
    </ContentSection>
  );
}
