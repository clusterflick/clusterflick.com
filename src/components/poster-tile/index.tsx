import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import EventPoster, {
  type EventPosterIncludedMovie,
} from "@/components/event-poster";
import PosterStatusMarkers from "@/components/poster-status-markers";
import styles from "./poster-tile.module.css";

export {
  default as RemovedPosterTile,
  type RemovedPosterTileProps,
} from "./removed-poster-tile";

/** A boxed note above a tile's control — what makes the film time-sensitive. */
export interface PosterTileNote {
  /** What it is — "Final showing", "Q&A with Mike Leigh". */
  label: string;
  /** When — "Tomorrow, 20:30". */
  detail?: string;
  /**
   * Where, on a line of its own that truncates rather than wraps, so a long
   * venue name doesn't make one note taller than the rest of its row.
   */
  venue?: string;
  /**
   * Pink by default. Yellow is the site's "last chance" colour, as on the
   * planner's tag, for a note that says the chance is running out.
   */
  color?: NoteColor;
}

type NoteColor = "pink" | "yellow";

const noteColorStyles: Record<NoteColor, string> = {
  pink: styles.notePink,
  yellow: styles.noteYellow,
};

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
   * Makes the whole tile a button, as `href` makes it a link: for picking a
   * film rather than going to it. Not with `href`.
   */
  onClick?: () => void;
  /** With `onClick`: drawn, but not pressable (already picked, say). */
  disabled?: boolean;
  /**
   * With `onClick`: what pressing it does ("Add"), over the poster while it's
   * pointed at or focused, and there all the time once `disabled` ("Added").
   */
  cue?: string;
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
  /**
   * Something to act on — a final showing, a Q&A — boxed at the foot of the
   * tile, above the action. At the foot rather than with the details, so tiles
   * with and without one keep their titles in line across the row.
   */
  note?: PosterTileNote;
  /**
   * Marks the poster with the reader's lists (watchlist, seen), as the browsing
   * grids do. Opt-in: on `/personalise` every tile is on a list already, so a
   * marker there would say nothing.
   */
  movieId?: string;
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
  onClick,
  disabled,
  cue,
  details = [],
  action,
  note,
  movieId,
}: PosterTileProps) {
  const poster = (
    <EventPoster
      title={title}
      posterPath={posterPath}
      includedMovies={includedMovies}
      size="xsmall"
      interactive={!!href || (!!onClick && !disabled)}
    />
  );
  // A button may only hold phrasing content, so as one the tile's text is
  // spans rather than a heading and paragraphs.
  const Title = onClick ? "span" : "h4";
  const Detail = onClick ? "span" : "p";
  const body = (
    <>
      {/* First, so it is the direct child of whatever the tile's target is:
          hovering that is what fans a stack of markers out */}
      {movieId && <PosterStatusMarkers movieId={movieId} />}
      {cue ? (
        <span className={styles.posterWithCue}>
          {poster}
          <span className={styles.cue} aria-hidden="true">
            {cue}
          </span>
        </span>
      ) : (
        poster
      )}
      <Title className={styles.title}>{title}</Title>
      {details.map((detail, index) => (
        <Detail key={index} className={styles.detail}>
          {detail}
        </Detail>
      ))}
    </>
  );

  const label = details.length > 0 ? `${title} — ${details.join(", ")}` : title;

  return (
    <li className={styles.tile}>
      {onClick ? (
        // One target, as the link below is, named for what pressing it does.
        <button
          type="button"
          className={clsx(styles.link, styles.button)}
          onClick={onClick}
          disabled={disabled}
          aria-label={cue ? `${cue}: ${label}` : label}
        >
          {body}
        </button>
      ) : href ? (
        // The poster and text are one target rather than separate links. The
        // label replaces the accessible name so a screen reader reads it once,
        // instead of the poster's alt text and the title in turn.
        <Link href={href} className={styles.link} aria-label={label}>
          {body}
        </Link>
      ) : (
        body
      )}
      {(note || action) && (
        <div className={styles.action}>
          {note && (
            <p
              className={clsx(
                styles.note,
                noteColorStyles[note.color ?? "pink"],
              )}
            >
              <strong className={styles.noteLabel} title={note.label}>
                {note.label}
              </strong>
              {note.detail && (
                <span className={styles.noteDetail}>{note.detail}</span>
              )}
              {note.venue && (
                <span className={styles.noteVenue} title={note.venue}>
                  {note.venue}
                </span>
              )}
            </p>
          )}
          {action}
        </div>
      )}
    </li>
  );
}

/** `PosterTileList`'s track minimum and column gap, as its stylesheet sets. */
export const TILE_MIN_WIDTH = 140;
export const TILE_GAP = 16;

/** How many tiles a `PosterTileList` this wide fits across. */
export function getTileColumnCount(width: number) {
  return Math.max(
    1,
    Math.floor((width + TILE_GAP) / (TILE_MIN_WIDTH + TILE_GAP)),
  );
}

/** The grid `PosterTile`s sit in: six across a 960px column, two on a phone. */
export function PosterTileList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ul className={clsx(styles.list, className)}>{children}</ul>;
}
