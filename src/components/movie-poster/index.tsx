import Image from "next/image";
import clsx from "clsx";
import { getPosterColor } from "@/utils/get-poster-color";
import styles from "./movie-poster.module.css";

/**
 * `xsmall` is for dense listings where many films appear at once (the updates
 * feed), `small` for standard grids and rows, `large` for detail pages.
 */
export type PosterSize = "xsmall" | "small" | "large";

const POSTER_DIMENSIONS: Record<
  PosterSize,
  { width: number; height: number; imageSize: string }
> = {
  xsmall: { width: 160, height: 240, imageSize: "w342" },
  small: { width: 200, height: 300, imageSize: "w342" },
  large: { width: 308, height: 462, imageSize: "w500" },
};

interface MoviePosterImageProps {
  title: string;
  size: PosterSize;
  posterPath: string;
  overlay: React.ReactNode | null;
  interactive: boolean;
  fluid: boolean;
  priority?: boolean;
}

function MoviePosterImage({
  title,
  size,
  posterPath,
  overlay,
  interactive,
  fluid,
  priority,
}: MoviePosterImageProps) {
  const { imageSize, ...dimensions } = POSTER_DIMENSIONS[size];
  const isPriority = priority ?? size === "large";
  const src = `https://image.tmdb.org/t/p/${imageSize}${posterPath}`;

  return (
    <div
      className={clsx(
        styles.poster,
        styles[size],
        fluid && styles.fluid,
        interactive && styles.interactive,
      )}
    >
      {/* Keyed by src so a poster swap mounts a fresh element rather than
          re-pointing this one: a re-pointed <img> keeps painting the previous
          poster until the new one decodes, which on a slow connection shows the
          outgoing film in the incoming film's place. A new element shows the
          empty poster panel instead. */}
      <Image
        key={src}
        src={src}
        alt={title}
        width={dimensions.width}
        height={dimensions.height}
        priority={isPriority}
      />
      {overlay}
    </div>
  );
}

interface TextPatternPosterProps {
  title: string;
  size: PosterSize;
  overlay: React.ReactNode | null;
  interactive: boolean;
  fluid: boolean;
}

function TextPatternPoster({
  title,
  size,
  overlay,
  interactive,
  fluid,
}: TextPatternPosterProps) {
  const color = getPosterColor(title);
  const displayTitle = title.toUpperCase();
  const rowCount = { large: 24, small: 18, xsmall: 14 }[size];
  const offsetStep = { large: 20, small: 15, xsmall: 12 }[size];

  // Create the repeating text for each row
  const repeatedText = `${displayTitle} `.repeat(8);

  return (
    <div
      className={clsx(
        styles.noPoster,
        styles[size],
        styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`],
        fluid && styles.fluid,
        interactive && styles.interactive,
      )}
    >
      <div className={styles.textPattern} aria-hidden="true">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div
            key={i}
            className={clsx(styles.textRow, i % 2 === 1 && styles.filled)}
            style={{
              transform: `translateX(${(-i * offsetStep) / (i % 2 === 1 ? 1 : 2)}px)`,
            }}
          >
            <span className={styles.textContent}>{repeatedText}</span>
          </div>
        ))}
      </div>
      <span className={styles.srOnly}>{title}</span>
      {overlay}
    </div>
  );
}

interface MoviePosterProps {
  posterPath?: string;
  title: string;
  subtitle?: string;
  size?: PosterSize;
  showOverlay?: boolean;
  /** Whether the poster is interactive (clickable). Controls hover animations. Defaults to true. */
  interactive?: boolean;
  /**
   * Fill the available width, capping at the size's fixed dimensions, instead of
   * always taking them. Needed inside fluid grid columns, where a fixed poster
   * overflows once the column is narrower than the poster. Always on for
   * `xsmall`. Defaults to false.
   */
  fluid?: boolean;
  /** Whether this image should be loaded eagerly with fetchpriority="high". */
  priority?: boolean;
  /** Heading level for the overlay title. Defaults to "h2". */
  headingLevel?: "h2" | "h3";
}

export default function MoviePoster({
  posterPath,
  title,
  subtitle,
  size = "small",
  showOverlay = false,
  interactive = true,
  fluid = false,
  priority,
  headingLevel: HeadingTag = "h2",
}: MoviePosterProps) {
  // For placeholder posters, always show the overlay so users know what the movie is
  const alwaysShowOverlay = !posterPath;

  const overlay = showOverlay ? (
    <div
      className={clsx(
        styles.overlay,
        alwaysShowOverlay && styles.overlayVisible,
      )}
    >
      <div>
        <HeadingTag className={styles.title}>{title}</HeadingTag>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  ) : null;

  if (posterPath) {
    return (
      <MoviePosterImage
        title={title}
        size={size}
        posterPath={posterPath}
        overlay={overlay}
        interactive={interactive}
        fluid={fluid}
        priority={priority}
      />
    );
  }

  return (
    <TextPatternPoster
      title={title}
      size={size}
      overlay={overlay}
      interactive={interactive}
      fluid={fluid}
    />
  );
}
