import Link from "next/link";
import { Movie } from "@/types";
import { getMovieUrl } from "@/utils/get-movie-url";
import StackedPoster from "@/components/stacked-poster";
import styles from "./part-of-section.module.css";

interface PartOfSectionProps {
  containingEvents: Omit<Movie, "performances">[];
}

export default function PartOfSection({
  containingEvents,
}: PartOfSectionProps) {
  if (!containingEvents || containingEvents.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.label}>Also showing as part of:</h3>
      <div className={styles.cardList}>
        {containingEvents.map((event) => (
          <Link
            key={event.id}
            href={getMovieUrl(event)}
            className={styles.card}
          >
            <StackedPoster
              mainPosterPath={event.posterPath}
              mainTitle={event.title}
              includedMovies={event.includedMovies || []}
              subtitle={event.year}
              showOverlay
              size="small"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
