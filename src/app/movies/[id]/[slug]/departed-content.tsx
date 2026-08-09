import type { Genre, Person } from "@/types";
import type { DepartedMovie } from "@/utils/get-departed-data";
import { formatDuration, formatDateLong } from "@/utils/format-date";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import MoviePoster from "@/components/movie-poster";
import ContentSection from "@/components/content-section";
import { ButtonLink } from "@/components/button";
import styles from "./departed.module.css";

type DepartedContentProps = {
  movie: DepartedMovie;
  genres: Record<string, Genre>;
  people: Record<string, Person>;
};

const namesFor = (ids: string[] | undefined, people: Record<string, Person>) =>
  (ids ?? []).map((id) => people[id]?.name).filter(Boolean) as string[];

/**
 * The page for a film that has finished its run.
 *
 * It is a static page in the plainest sense: no filters, no client data, no
 * showings — the film is not screening anywhere, and the honest version of this
 * page says so rather than rendering a listings page with nothing in it. It
 * exists so that a link to a film, shared or indexed while it was on, still
 * lands somewhere that answers the question.
 */
export default function DepartedContent({
  movie,
  genres,
  people,
}: DepartedContentProps) {
  const directors = namesFor(movie.directors, people);
  const cast = namesFor(movie.actors, people);
  const genreNames = (movie.genres ?? [])
    .map((id) => genres[id]?.name)
    .filter(Boolean) as string[];

  return (
    <main id="main-content" className={styles.page}>
      <PageHeader backUrl="/films" backText="Back to film list" />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backgroundImageAlt={`${movie.title} backdrop`}
        contentClassName={styles.heroContent}
      >
        <div className={styles.posterSection}>
          <MoviePoster
            posterPath={movie.posterPath}
            title={movie.title}
            size="large"
          />
        </div>

        <div className={styles.mainInfo}>
          <OutlineHeading className={styles.title}>
            {movie.title}
          </OutlineHeading>

          <div className={styles.metadata}>
            {!!movie.year && <span>{movie.year}</span>}
            {!!movie.classification && (
              <span className={styles.classification}>
                {movie.classification}
              </span>
            )}
            {!!movie.duration && <span>{formatDuration(movie.duration)}</span>}
          </div>

          {genreNames.length > 0 && (
            <p className={styles.genres}>{genreNames.join(", ")}</p>
          )}

          <p className={styles.status}>
            Not currently screening in London
            {movie.lastPerformance
              ? ` — last screened ${formatDateLong(movie.lastPerformance)}`
              : ""}
          </p>

          {movie.overview && (
            <p className={styles.overview}>{movie.overview}</p>
          )}

          <ButtonLink href="/films" className={styles.action}>
            Browse what&rsquo;s on
          </ButtonLink>
        </div>
      </HeroSection>

      {(directors.length > 0 || cast.length > 0) && (
        <div className={styles.detailsContainer}>
          <ContentSection title="Cast &amp; crew">
            <dl className={styles.credits}>
              {directors.length > 0 && (
                <>
                  <dt>{directors.length > 1 ? "Directors" : "Director"}</dt>
                  <dd>{directors.join(", ")}</dd>
                </>
              )}
              {cast.length > 0 && (
                <>
                  <dt>Starring</dt>
                  <dd>{cast.join(", ")}</dd>
                </>
              )}
            </dl>
          </ContentSection>
        </div>
      )}
    </main>
  );
}
