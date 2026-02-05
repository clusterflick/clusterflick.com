import Link from "next/link";
import { Movie } from "@/types";
import { getMovieUrl } from "@/utils/get-movie-url";
import { getIncludedMovies } from "@/utils/get-included-movies";
import CardGrid from "@/components/card-grid";
import StackedPoster from "@/components/stacked-poster";
import styles from "./part-of-section.module.css";

interface PartOfSectionProps {
  parentMovies: Omit<Movie, "performances">[];
}

export default function PartOfSection({ parentMovies }: PartOfSectionProps) {
  if (!parentMovies || parentMovies.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.label}>
        {parentMovies.length === 1 ? "Also showing as:" : "Also showing in:"}
      </h3>
      <CardGrid size="md" gap="md">
        {parentMovies.map((parentMovie) => {
          const includedMovies = getIncludedMovies(parentMovie.showings);

          return (
            <Link
              key={parentMovie.id}
              href={getMovieUrl(parentMovie)}
              className={styles.card}
            >
              <StackedPoster
                mainPosterPath={parentMovie.posterPath}
                mainTitle={parentMovie.title}
                includedMovies={includedMovies || []}
                subtitle={parentMovie.year}
                showOverlay
                size="small"
              />
            </Link>
          );
        })}
      </CardGrid>
    </div>
  );
}
