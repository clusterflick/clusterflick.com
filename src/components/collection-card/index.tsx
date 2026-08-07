import NavCard from "@/components/nav-card";
import MoviePoster from "@/components/movie-poster";
import styles from "./collection-card.module.css";

export interface CollectionCardItem {
  id: string;
  name: string;
  href: string;
  posterPath?: string;
  /** Films in the collection with upcoming performances. */
  showingCount: number;
  /** Films in the collection in total. */
  partCount: number;
}

/**
 * A clickable card for a film collection — a franchise or series such as Harry
 * Potter or Alien — showing its poster and how much of it is screening.
 *
 * **When to use:**
 * - Listing pages for collections.
 *
 * **When NOT to use:**
 * - Festivals and film clubs — use `EventCard`, which is built around a logo.
 * - Individual films — use `FilmPosterGrid`.
 */
export default function CollectionCard({
  name,
  href,
  posterPath,
  showingCount,
  partCount,
}: CollectionCardItem) {
  return (
    <NavCard href={href} className={styles.card}>
      <MoviePoster
        posterPath={posterPath}
        title={name}
        size="small"
        interactive={false}
        fluid
      />
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.meta}>
          {showingCount > 0 ? (
            <span className={styles.showing}>
              {showingCount} of {partCount} showing
            </span>
          ) : (
            <span className={styles.notShowing}>
              {partCount} films · none showing
            </span>
          )}
        </p>
      </div>
    </NavCard>
  );
}
