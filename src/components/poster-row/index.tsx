import Link from "next/link";
import clsx from "clsx";
import type { Movie } from "@/types";
import { getMovieUrl } from "@/utils/get-movie-url";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import styles from "./poster-row.module.css";

export interface PosterRowItem {
  movie: Movie;
  /** Optional context line shown on the poster overlay (falls back to year). */
  subtitle?: string;
}

interface PosterRowProps {
  title: string;
  movies: PosterRowItem[];
  /** Optional explanatory line shown under the title. */
  intro?: string;
  /** Heading level for the row title (default "h2"). */
  titleAs?: "h2" | "h3";
  /** Optional "see all" link shown beside the title. */
  seeAllHref?: string;
  seeAllLabel?: string;
  /**
   * Append `#show-all` to each poster link so the movie page opens with past
   * showings already expanded. Used by rows (e.g. New Additions) where the point
   * is the full schedule, not just what's upcoming.
   */
  showAll?: boolean;
}

/**
 * A titled, horizontally-scrolling row of film posters — the same presentation
 * as the "Most Shown with…" rows on the accessibility page. Used for the
 * discovery sections on the home page. Renders nothing when empty.
 */
export default function PosterRow({
  title,
  movies,
  intro,
  titleAs: TitleTag = "h2",
  seeAllHref,
  seeAllLabel = "See all",
  showAll = false,
}: PosterRowProps) {
  if (movies.length === 0) return null;

  return (
    <section className={styles.row}>
      <div className={clsx(styles.header, intro && styles.headerTight)}>
        <TitleTag className={styles.title}>{title}</TitleTag>
        {seeAllHref && (
          <Link href={seeAllHref} className={styles.seeAll}>
            {seeAllLabel} →
          </Link>
        )}
      </div>
      {intro && <p className={styles.intro}>{intro}</p>}
      <div className={styles.posterScroller}>
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
              href={`${getMovieUrl(movie)}${showAll ? "#show-all" : ""}`}
              className={styles.posterLink}
            >
              {useStackedPoster ? (
                <StackedPoster
                  mainPosterPath={movie.posterPath}
                  mainTitle={movie.title}
                  includedMovies={includedMovies}
                  subtitle={posterSubtitle}
                  showOverlay
                  interactive
                  headingLevel="h3"
                />
              ) : (
                <MoviePoster
                  posterPath={
                    movie.posterPath || includedWithPosters[0]?.posterPath
                  }
                  title={movie.title}
                  subtitle={posterSubtitle}
                  showOverlay
                  interactive
                  headingLevel="h3"
                />
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
