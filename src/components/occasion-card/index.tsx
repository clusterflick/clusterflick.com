import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import EventPoster, {
  getPrimaryPosterPath,
  type EventPosterIncludedMovie,
} from "@/components/event-poster";
import PosterStatusMarkers from "@/components/poster-status-markers";
import styles from "./occasion-card.module.css";

export {
  default as RemovedOccasionCard,
  type RemovedOccasionCardProps,
} from "./removed-occasion-card";

/**
 * Pink by default, for an occasion. Yellow is the site's "last chance" colour,
 * as on the planner's tag and the home page's Last Chance badge.
 */
export type OccasionCardTone = "pink" | "yellow";

export interface OccasionCardProps {
  /** The film's id, which the reader's list markers look up. */
  id: string;
  href: string;
  /** The film. */
  title: string;
  posterPath?: string;
  /**
   * A double bill's or marathon's films: drawn as a stack of posters, and the
   * wash taken from the first with one when the event has none of its own.
   */
  includedMovies?: EventPosterIncludedMovie[];
  /**
   * What leads the card, in large type: "Q&A with Mike Leigh", or "Final
   * screening".
   */
  lead: string;
  /** "Mon 24 Aug, 19:30". */
  when: string;
  venue?: string | null;
  tone?: OccasionCardTone;
  /** The lead's heading level, one below whatever the cards sit under. */
  headingLevel?: "h3" | "h4";
  /**
   * Marks the poster with the reader's lists, as the poster rows do. On for a
   * row of anyone's films; off where every film is on a list already (a
   * reader's own watchlist), since a marker there says nothing.
   */
  showMarkers?: boolean;
  /**
   * A control under the card — removing a film from a reader's list. Outside
   * the link, since a button can't sit inside one.
   */
  action?: ReactNode;
}

/**
 * A wide card that leads with what makes a screening worth catching — the
 * guest, the live score, the last night — in large type, with the film, day
 * and venue beneath. The poster sits beside it and is blurred behind the card
 * as a wash. A row of them costs one card's height however many there are,
 * where poster tiles wrap onto row after row.
 *
 * **When to use:**
 * - In a horizontal row (`OccasionRow`, or a `PosterScroller` of its own) where
 *   one showing is the reason to go: an occasion, or a final screening.
 *
 * **When NOT to use:**
 * - Rows where the film is the point — use `PosterRow` or `PosterTile`.
 * - A short grid of picks each with a reason label — use `PickCard`.
 */
export default function OccasionCard({
  id,
  href,
  title,
  posterPath,
  includedMovies,
  lead,
  when,
  venue,
  tone = "pink",
  headingLevel: Lead = "h3",
  showMarkers = true,
  action,
}: OccasionCardProps) {
  const washPath = getPrimaryPosterPath(posterPath, includedMovies);
  return (
    <div className={clsx(styles.card, tone === "yellow" && styles.yellow)}>
      {washPath && (
        <span
          className={styles.wash}
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/w342${washPath})`,
          }}
          aria-hidden="true"
        />
      )}
      <Link href={href} className={styles.link}>
        <div className={styles.poster}>
          <EventPoster
            posterPath={posterPath}
            includedMovies={includedMovies}
            title={title}
            size="xsmall"
            interactive={false}
          />
        </div>
        <div className={styles.body}>
          <span className={styles.when}>{when}</span>
          <Lead className={styles.lead}>{lead}</Lead>
          <span className={styles.film}>{title}</span>
          {venue && <span className={styles.venue}>{venue}</span>}
        </div>
        {showMarkers && <PosterStatusMarkers movieId={id} />}
      </Link>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
