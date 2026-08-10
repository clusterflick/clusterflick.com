import type { Genre, Person } from "@/types";
import type { DepartedMovie } from "@/utils/get-departed-data";
import { formatDuration, formatDateLong } from "@/utils/format-date";
import { getMovieUrl } from "@/utils/get-movie-url";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import MoviePoster from "@/components/movie-poster";
import ContentSection from "@/components/content-section";
import EmptyState from "@/components/empty-state";
import { ButtonLink, ButtonAnchor } from "@/components/button";
import { PlayIcon } from "@/components/icons";
import GenresList from "./components/genres-list";
import CastCrewSection from "./components/cast-crew-section";
import styles from "./page.module.css";

type DepartedContentProps = {
  movie: DepartedMovie;
  genres: Record<string, Genre>;
  people: Record<string, Person>;
  /** When the data was generated, which is as close to "now" as a static page gets. */
  buildTime: number;
};

/**
 * The page for a film that has finished its run.
 *
 * Built from the live movie page's own sections and stylesheet, so it is that
 * page with the showings removed rather than a different kind of page. The one
 * thing it says for itself goes where the showings would be, which is where a
 * reader arriving from an old link is already looking.
 *
 * The live page's "Appears on" list pills are left off deliberately, not
 * missing: telling someone that a film they cannot watch is in the top 300
 * helps nobody, and the lists cut the same way round — their pages only draw
 * from what is showing.
 */
export default function DepartedContent({
  movie,
  genres,
  people,
  buildTime,
}: DepartedContentProps) {
  // `lastPerformance` is the latest performance we ever had *listed*, not the
  // last one that happened, so it can sit in the future — a film whose match
  // was lost, or whose remaining screenings were cancelled, keeps the date of a
  // screening that never came. "Last screened" is nonsense for those, so it
  // goes unsaid rather than said wrongly.
  const lastScreened =
    movie.lastPerformance && movie.lastPerformance <= buildTime
      ? movie.lastPerformance
      : undefined;
  return (
    <main id="main-content" className={styles.page}>
      <PageHeader backUrl="/films" backText="Back to film list" />

      <HeroSection
        backgroundImage={
          movie.posterPath
            ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
            : "/images/light-circles.jpg"
        }
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

          {/* No showings to draw categories from, and none to draw: a departed
              film is always a TMDB match, so every genre here is a real one. */}
          <GenresList
            genreIds={movie.genres || []}
            genres={genres}
            showings={{}}
          />

          {movie.overview && (
            <p className={styles.overview}>{movie.overview}</p>
          )}

          {/* The live page hangs this off RatingsGrid's extraItem slot, which
              renders nothing without ratings — and a departed film has none,
              since the match stage only ever sees the combined data. With no
              screenings left to link to, the trailer is the most useful thing
              the page still has, so it is rendered on its own. */}
          {movie.youtubeTrailer && (
            <div className={styles.trailerRow}>
              <ButtonAnchor
                href={`https://www.youtube.com/watch?v=${movie.youtubeTrailer}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.trailerButton}
              >
                <PlayIcon />
                Watch Trailer
              </ButtonAnchor>
            </div>
          )}

          <CastCrewSection
            directors={movie.directors}
            actors={movie.actors}
            people={people}
          />
        </div>
      </HeroSection>

      <div className={styles.detailsContainer}>
        <ContentSection
          title="Showings"
          icon={{
            src: "/images/icons/neon-ticket.svg",
            width: 58,
            height: 33,
          }}
        >
          {/* A listing under this film's title is still on, but we could not
              confirm it is the same film — so the page offers it rather than
              flatly stating nothing is showing, which would be wrong whenever
              a match was lost rather than a run ending. */}
          {movie.stillListedAs ? (
            <EmptyState
              icon={{
                src: "/images/icons/neon-ticket-ripped.svg",
                width: 120,
                height: 80,
              }}
              message="This film may still be showing"
              hint={`A listing for “${movie.stillListedAs.title}” is on, but we couldn’t confirm it’s the same film.`}
              actions={
                <>
                  <ButtonLink href={getMovieUrl(movie.stillListedAs)}>
                    Were you looking for “{movie.stillListedAs.title}”?
                  </ButtonLink>
                  <ButtonLink href="/films" variant="secondary">
                    See what else is showing
                  </ButtonLink>
                </>
              }
            />
          ) : (
            <EmptyState
              icon={{
                src: "/images/icons/neon-ticket-ripped.svg",
                width: 120,
                height: 80,
              }}
              message="Not currently screening in London"
              hint={
                lastScreened
                  ? `Last screened ${formatDateLong(lastScreened)}`
                  : undefined
              }
              actions={
                <ButtonLink href="/films">
                  See what else is showing in London
                </ButtonLink>
              }
            />
          )}
        </ContentSection>
      </div>
    </main>
  );
}
