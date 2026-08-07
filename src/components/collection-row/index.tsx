import Link from "next/link";
import type { CollectionSummary } from "@/types";
import { getCollectionUrl } from "@/utils/get-collection-url";
import MoviePoster from "@/components/movie-poster";
import PosterScroller from "@/components/poster-row/scroller";
import styles from "./collection-row.module.css";

export interface CollectionRowItem {
  collection: CollectionSummary;
  /** Films from the collection currently showing. */
  showingCount: number;
}

interface CollectionRowProps {
  title: string;
  collections: CollectionRowItem[];
  /** Optional explanatory line shown under the title. */
  intro?: string;
  /** Optional "see all" link shown beside the title. */
  seeAllHref?: string;
  seeAllLabel?: string;
}

/**
 * A titled, horizontally-scrolling row of collection posters, matching
 * `PosterRow`'s presentation but linking to collection pages rather than films.
 * Renders nothing when empty.
 *
 * **When to use:**
 * - Surfacing franchises and series on the discovery home page.
 *
 * **When NOT to use:**
 * - Rows of individual films — use `PosterRow`.
 * - A full listing page — use `CollectionCard` in a grid.
 */
export default function CollectionRow({
  title,
  collections,
  intro,
  seeAllHref,
  seeAllLabel = "See all",
}: CollectionRowProps) {
  if (collections.length === 0) return null;

  return (
    <section className={styles.row}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className={styles.seeAll}>
            {seeAllLabel} →
          </Link>
        )}
      </div>
      {intro && <p className={styles.intro}>{intro}</p>}
      <PosterScroller>
        {collections.map(({ collection, showingCount }) => (
          <Link
            key={collection.id}
            href={getCollectionUrl(collection)}
            className={styles.posterLink}
          >
            <MoviePoster
              posterPath={collection.posterPath}
              title={collection.name}
              subtitle={`${showingCount} of ${collection.partCount} showing`}
              showOverlay
              interactive
              headingLevel="h3"
            />
          </Link>
        ))}
      </PosterScroller>
    </section>
  );
}
