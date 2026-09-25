import type { ReactNode } from "react";
import Link from "next/link";
import EventPoster, {
  type EventPosterIncludedMovie,
} from "@/components/event-poster";
import styles from "./poster-tile.module.css";

export interface PosterTileProps {
  title: string;
  posterPath?: string;
  /**
   * Multi-film events never carry artwork of their own, so they take it from
   * the films inside — stacked when there is more than one to show.
   */
  includedMovies?: EventPosterIncludedMovie[];
  /** Where the tile leads. Without one, the tile is drawn unlinked. */
  href?: string;
  /**
   * Short lines under the title — a venue, a count, a year. The first reads
   * more strongly than the rest.
   */
  details?: string[];
  /**
   * A control under the text — removing a film from a reader's list. Outside
   * the link, since a button can't sit inside one.
   */
  action?: ReactNode;
}

/**
 * A compact poster with its title and a line or two of detail underneath, for
 * dense grids where the title has to be readable without hovering.
 */
export default function PosterTile({
  title,
  posterPath,
  includedMovies,
  href,
  details = [],
  action,
}: PosterTileProps) {
  const body = (
    <>
      <EventPoster
        title={title}
        posterPath={posterPath}
        includedMovies={includedMovies}
        size="xsmall"
        interactive={!!href}
      />
      <h4 className={styles.title}>{title}</h4>
      {details.map((detail, index) => (
        <p key={index} className={styles.detail}>
          {detail}
        </p>
      ))}
    </>
  );

  return (
    <li className={styles.tile}>
      {href ? (
        // The poster and text are one target rather than separate links. The
        // label replaces the accessible name so a screen reader reads it once,
        // instead of the poster's alt text and the title in turn.
        <Link
          href={href}
          className={styles.link}
          aria-label={
            details.length > 0 ? `${title} — ${details.join(", ")}` : title
          }
        >
          {body}
        </Link>
      ) : (
        body
      )}
      {action && <div className={styles.action}>{action}</div>}
    </li>
  );
}

/** The grid `PosterTile`s sit in: six across a 960px column, two on a phone. */
export function PosterTileList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}
