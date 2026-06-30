import Link from "next/link";
import type { Movie } from "@/types";
import { getMovieUrl } from "@/utils/get-movie-url";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import FilmPosterGridClient, {
  type FilmPosterGridItem,
} from "./film-poster-grid-client";
import styles from "./film-poster-grid.module.css";

interface FilmPosterGridProps {
  movies: { movie: Movie; performanceCount: number; subtitle?: string }[];
  truncated?: boolean;
  exploreHref?: string;
  exploreLabel?: string;
  showAll?: boolean;
  movieUrlParams?: string;
  /**
   * When set, the grid prunes any movie that no longer has a current performance
   * at this venue once the client data loads (the static HTML still ships the
   * full build-time list). Leave unset to render the list as-is.
   */
  venueId?: string;
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
  const items: FilmPosterGridItem[] = movies.map(({ movie, subtitle }) => {
    const includedMovies = movie.includedMovies;
    const includedWithPosters =
      includedMovies?.filter((m) => m.posterPath) || [];
    const totalPosters =
      (movie.posterPath ? 1 : 0) + includedWithPosters.length;
    const useStackedPoster =
      includedMovies && includedMovies.length > 1 && totalPosters >= 2;
    const posterSubtitle = subtitle ?? movie.year;

    return {
      id: movie.id,
      node: (
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
      ),
    };
  });

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
