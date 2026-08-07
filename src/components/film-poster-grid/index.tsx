import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { Movie } from "@/types";
import { getMovieUrl } from "@/utils/get-movie-url";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import FilmPosterGridClient, {
  type FilmPosterGridItem,
} from "./film-poster-grid-client";
import styles from "./film-poster-grid.module.css";

/**
 * The fields the grid needs to draw a poster. `Movie` satisfies it; so does a
 * film that isn't in the dataset at all, which is what `unavailable` items are.
 */
export type FilmPosterGridFilm = Pick<Movie, "id" | "title"> &
  Partial<Pick<Movie, "posterPath" | "year" | "includedMovies">>;

export interface FilmPosterGridMovie {
  movie: FilmPosterGridFilm;
  performanceCount: number;
  subtitle?: string;
  /**
   * Optional marker over the poster's corner — a film's rank within a list, or
   * an award emblem. Purely decorative: it never takes the click.
   */
  badge?: ReactNode;
  /**
   * "text" (default) draws a chip top-left, for a rank. "icon" draws a bare
   * emblem bottom-right with a drop shadow, for an award mark.
   */
  badgeVariant?: "text" | "icon";
  /**
   * Where the poster leads, when that isn't the film's own page — a film that
   * only screens inside a double bill points at the double bill. The item's
   * lifetime follows this entry too, so a poster whose event drops out of the
   * client data disappears with it rather than linking into nothing.
   */
  linkTo?: FilmPosterGridFilm;
  /**
   * Draws the poster dimmed and unlinked — a film shown for completeness that
   * has nothing to book, such as the rest of a collection. These entries are
   * exempt from the client-side pruning, having no dataset entry to be pruned
   * against. Pair with `notice` to say why the poster does nothing.
   */
  unavailable?: boolean;
  /**
   * Notice drawn across the top of the poster. Tinted by whether the film is
   * bookable: muted when `unavailable`, accented when the notice is explaining
   * a detour rather than a dead end.
   */
  notice?: string;
}

interface FilmPosterGridProps {
  movies: FilmPosterGridMovie[];
  truncated?: boolean;
  exploreHref?: string;
  exploreLabel?: string;
  showAll?: boolean;
  movieUrlParams?: string;
  /**
   * When set, the grid prunes any movie that no longer has a current performance
   * at this venue (or, given an array, any of these venues) once the client data
   * loads (the static HTML still ships the full build-time list). Leave unset to
   * render the list as-is.
   */
  venueId?: string | string[];
}

export default function FilmPosterGrid({
  movies,
  truncated,
  exploreHref,
  exploreLabel,
  showAll,
  movieUrlParams,
  venueId,
}: FilmPosterGridProps) {
  const items: FilmPosterGridItem[] = movies.map(
    ({ movie, linkTo, subtitle, badge, badgeVariant, unavailable, notice }) => {
      const includedMovies = movie.includedMovies;
      const includedWithPosters =
        includedMovies?.filter((m) => m.posterPath) || [];
      const totalPosters =
        (movie.posterPath ? 1 : 0) + includedWithPosters.length;
      const useStackedPoster =
        includedMovies && includedMovies.length > 1 && totalPosters >= 2;
      const posterSubtitle = subtitle ?? movie.year;

      const poster = (
        <>
          {badge != null && (
            <span
              className={
                badgeVariant === "icon" ? styles.badgeEmblem : styles.badge
              }
            >
              {badge}
            </span>
          )}
          {useStackedPoster ? (
            <StackedPoster
              mainPosterPath={movie.posterPath}
              mainTitle={movie.title}
              includedMovies={includedMovies}
              subtitle={posterSubtitle}
              showOverlay
              interactive={!unavailable}
            />
          ) : (
            <MoviePoster
              posterPath={
                movie.posterPath || includedWithPosters[0]?.posterPath
              }
              title={movie.title}
              subtitle={posterSubtitle}
              showOverlay
              interactive={!unavailable}
            />
          )}
        </>
      );

      const noticeBar = notice ? (
        <span
          className={clsx(
            styles.notice,
            unavailable ? styles.noticeMuted : styles.noticeAccent,
          )}
        >
          {notice}
        </span>
      ) : null;

      const target = linkTo ?? movie;

      return {
        id: target.id,
        unavailable,
        node: unavailable ? (
          <div
            key={movie.id}
            className={clsx(styles.filmGridLink, styles.unavailable)}
          >
            {noticeBar}
            <div className={styles.unavailableFilm}>{poster}</div>
          </div>
        ) : (
          <Link
            key={movie.id}
            href={`${getMovieUrl(target)}${movieUrlParams ? `?${movieUrlParams}` : ""}${showAll ? "#show-all" : ""}`}
            className={styles.filmGridLink}
          >
            {noticeBar}
            {poster}
          </Link>
        ),
      };
    },
  );

  return (
    <FilmPosterGridClient
      items={items}
      truncated={truncated}
      exploreHref={exploreHref}
      exploreLabel={exploreLabel}
      venueId={venueId}
    />
  );
}
