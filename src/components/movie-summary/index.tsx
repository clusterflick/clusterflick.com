import Link from "next/link";
import clsx from "clsx";
import EventPoster, {
  type EventPosterIncludedMovie,
} from "@/components/event-poster";
import Tag from "@/components/tag";
import { formatDuration } from "@/utils/format-date";
import { setUseBrowserBack } from "@/utils/nav-links";
import styles from "./movie-summary.module.css";

interface MovieSummaryProps {
  /** The film's listing page. Both the poster and the title link to it. */
  href: string;
  title: string;
  year?: string;
  /** Shown only when it differs from `title`, as the listing page does. */
  originalTitle?: string;
  classification?: string;
  /** Milliseconds, as on `Movie`. */
  duration?: number;
  /** Genre names, already resolved from ids. */
  genres?: string[];
  posterPath?: string;
  /** A double bill's or marathon's films, shown as a stacked poster. */
  includedMovies?: EventPosterIncludedMovie[];
  /** Heading level for the title. Defaults to "h2". */
  headingLevel?: "h2" | "h3";
  className?: string;
}

/**
 * The top of a film's listing page, compressed to fit one row: small poster,
 * title and year, then original title, certificate, running time and genres.
 * Built for a narrow viewport first; wider screens only get more room.
 */
export default function MovieSummary({
  href,
  title,
  year,
  originalTitle,
  classification,
  duration,
  genres = [],
  posterPath,
  includedMovies,
  headingLevel: HeadingTag = "h2",
  className,
}: MovieSummaryProps) {
  const hasMetadata = !!classification || !!duration;

  return (
    <div className={clsx(styles.summary, className)}>
      {/* The title link carries the name; this is the same destination as a
          bigger target, so it is hidden from the tab order and screen readers
          rather than announced twice. */}
      <Link
        href={href}
        className={styles.posterLink}
        tabIndex={-1}
        aria-hidden="true"
        onClick={setUseBrowserBack}
      >
        {/* Fluid so the image covers the whole box: otherwise it sits inside
            the padding meant for the text-only placeholder, which at this
            size shrinks it by a third and crops it. Not interactive: the zoom
            comes from the shared poster-and-title hover in the CSS, and a
            stack's fan-out is too much movement at this size. */}
        <EventPoster
          posterPath={posterPath}
          includedMovies={includedMovies}
          title={title}
          size="xsmall"
          fluid
          interactive={false}
        />
      </Link>
      <div className={styles.details}>
        <HeadingTag className={styles.heading}>
          <Link href={href} onClick={setUseBrowserBack}>
            {title}
          </Link>
          {year && <span className={styles.year}>{year}</span>}
        </HeadingTag>
        {/* Details, then genres: three lines whatever the film carries, so
            a long list reads down evenly. */}
        {(originalTitle || hasMetadata) && (
          <div className={styles.metadata}>
            {originalTitle && (
              <em className={styles.originalTitle} title={originalTitle}>
                {originalTitle}
              </em>
            )}
            {classification && (
              <span className={styles.classification}>{classification}</span>
            )}
            {!!duration && (
              <span className={styles.duration}>
                {formatDuration(duration)}
              </span>
            )}
          </div>
        )}
        {genres.length > 0 && (
          <div className={styles.genres}>
            {genres.map((genre) => (
              <Tag key={genre} size="sm">
                {genre}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
