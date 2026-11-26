import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import EventPoster, {
  getPrimaryPosterPath,
  type EventPosterIncludedMovie,
} from "@/components/event-poster";
import PosterStatusMarkers from "@/components/poster-status-markers";
import styles from "./headline-card.module.css";

export {
  default as RemovedHeadlineCard,
  type RemovedHeadlineCardProps,
} from "./removed-headline-card";

/**
 * What the eyebrow and hover say about the card. Pink for an occasion, a
 * night that won't come round again. Yellow is the site's "last chance"
 * colour, as on the planner's tag and the home page's Last Chance badge. Gray
 * for a fact with nothing to book, such as a reader's longest film: pink or
 * yellow there would read as a call to act.
 */
export type HeadlineCardTone = "pink" | "yellow" | "gray";

const toneStyles: Record<HeadlineCardTone, string | undefined> = {
  pink: undefined,
  yellow: styles.yellow,
  gray: styles.gray,
};

export interface HeadlineCardProps {
  /** The film's id, which the reader's list markers look up. */
  id: string;
  /** Where the card leads. Without one, the card is drawn unlinked. */
  href?: string;
  /** The film. */
  title: string;
  posterPath?: string;
  /**
   * A double bill's or marathon's films: drawn as a stack of posters, and the
   * wash taken from the first with one when the event has none of its own.
   */
  includedMovies?: EventPosterIncludedMovie[];
  /**
   * The headline, in large type: "Q&A with Mike Leigh", "Final screening",
   * "2h 50m".
   */
  lead: string;
  /** The small line above it: "Mon 24 Aug, 19:30", "Longest sit". */
  eyebrow: string;
  /** The line at the foot, under a rule: the venue, or the film's year. */
  detail?: string | null;
  tone?: HeadlineCardTone;
  /** The lead's heading level, one below whatever the cards sit under. */
  headingLevel?: "h3" | "h4";
  /**
   * Marks the poster with the reader's lists, as the poster rows do. On for a
   * row of anyone's films; off where every film is on a list already (a
   * reader's own watchlist), since a marker there says nothing.
   */
  showMarkers?: boolean;
  /**
   * Fills its grid cell rather than taking a row's fixed width: for a grid
   * (`CardDeck`) rather than a scrolling row.
   */
  fluid?: boolean;
  /**
   * A control under the card — removing a film from a reader's list. Outside
   * the link, since a button can't sit inside one.
   */
  action?: ReactNode;
}

/**
 * A wide card that leads with one fact about a film in large type: an
 * occasion, a final screening, a record. The eyebrow above it says when or
 * what, and the film and a detail sit beneath. The poster sits beside it and is
 * blurred behind the card as a wash.
 *
 * **When to use:**
 * - Where one fact about a film is the point, in a scrolling row
 *   (`OccasionRow`) or a grid (`CardDeck`, the Seen records).
 *
 * **When NOT to use:**
 * - Rows where the film is the point — use `PosterRow` or `PosterTile`.
 * - A short grid of picks each with a reason label — use `PickCard`.
 */
export default function HeadlineCard({
  id,
  href,
  title,
  posterPath,
  includedMovies,
  lead,
  eyebrow,
  detail,
  tone = "pink",
  headingLevel: Lead = "h3",
  showMarkers = true,
  fluid = false,
  action,
}: HeadlineCardProps) {
  const washPath = getPrimaryPosterPath(posterPath, includedMovies);
  const content = (
    <>
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
        <span className={styles.eyebrow}>{eyebrow}</span>
        <Lead className={styles.lead}>{lead}</Lead>
        <span className={styles.film}>{title}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </div>
      {showMarkers && <PosterStatusMarkers movieId={id} />}
    </>
  );
  return (
    <div className={clsx(styles.card, toneStyles[tone], fluid && styles.fluid)}>
      {washPath && (
        <span
          className={styles.wash}
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/w342${washPath})`,
          }}
          aria-hidden="true"
        />
      )}
      {href ? (
        <Link href={href} className={styles.link}>
          {content}
        </Link>
      ) : (
        <div className={styles.link}>{content}</div>
      )}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
