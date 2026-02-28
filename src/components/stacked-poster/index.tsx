import Image from "next/image";
import clsx from "clsx";
import { getPosterColor } from "@/utils/get-poster-color";
import styles from "./stacked-poster.module.css";

interface StackedPosterProps {
  /** The main movie's poster path */
  mainPosterPath?: string;
  /** The main movie's title */
  mainTitle: string;
  /** Array of included movies with their poster paths */
  includedMovies: Array<{
    posterPath?: string;
    title: string;
  }>;
  /** Subtitle to show on hover */
  subtitle?: string;
  /** Whether to show the overlay on hover */
  showOverlay?: boolean;
  /** Size variant */
  size?: "small" | "large";
  /** Whether the poster is interactive (clickable). Controls hover animations. Defaults to true. */
  interactive?: boolean;
  /** Whether images should be loaded eagerly with fetchpriority="high". */
  priority?: boolean;
  /** Heading level for the overlay title. Defaults to "h2". */
  headingLevel?: "h2" | "h3";
}

// Dimensions for poster cards at each size
const POSTER_DIMENSIONS = {
  small: { width: 168, height: 252 },
  large: { width: 257, height: 385 },
};

function PosterImage({
  posterPath,
  title,
  className,
  size = "small",
  priority,
}: {
  posterPath?: string;
  title: string;
  className?: string;
  size?: "small" | "large";
  priority?: boolean;
}) {
  const dimensions = POSTER_DIMENSIONS[size];
  const sizeClass = size === "large" ? styles.posterCardLarge : "";

  if (posterPath) {
    const imageSize = size === "large" ? "w500" : "w342";
    return (
      <div className={clsx(styles.posterCard, sizeClass, className)}>
        <Image
          src={`https://image.tmdb.org/t/p/${imageSize}${posterPath}`}
          alt={title}
          width={dimensions.width}
          height={dimensions.height}
          className={styles.posterImage}
          {...(priority ? { priority: true } : {})}
        />
      </div>
    );
  }

  // Fallback pattern for missing posters
  const color = getPosterColor(title);
  const displayTitle = title.toUpperCase();
  const repeatedText = `${displayTitle} `.repeat(4);
  const rowCount = size === "large" ? 20 : 14;
  const offsetStep = size === "large" ? 18 : 12;

  return (
    <div
      className={clsx(
        styles.posterCard,
        sizeClass,
        styles.noPoster,
        styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`],
        className,
      )}
    >
      <div className={styles.textPattern} aria-hidden="true">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div
            key={i}
            className={clsx(styles.textRow, i % 2 === 1 && styles.filled)}
            style={{ transform: `translateX(${-i * offsetStep}px)` }}
          >
            <span className={styles.textContent}>{repeatedText}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Position configs for different poster counts and sizes
// Spread from top-left (0,0) to bottom-right
const POSITIONS = {
  small: {
    // Container: 200x300, Poster: 168x252, Available: 32x48
    1: [{ top: 24, left: 16 }],
    2: [
      { top: 0, left: 0 },
      { top: 48, left: 32 },
    ],
    3: [
      { top: 0, left: 0 },
      { top: 24, left: 16 },
      { top: 48, left: 32 },
    ],
  },
  large: {
    // Container: 308x462, Poster: 257x385, Available: 51x77
    1: [{ top: 38, left: 25 }],
    2: [
      { top: 0, left: 0 },
      { top: 77, left: 51 },
    ],
    3: [
      { top: 0, left: 0 },
      { top: 38, left: 25 },
      { top: 77, left: 51 },
    ],
  },
};

export default function StackedPoster({
  mainPosterPath,
  mainTitle,
  includedMovies,
  subtitle,
  showOverlay = false,
  size = "small",
  interactive = true,
  priority,
  headingLevel: HeadingTag = "h2",
}: StackedPosterProps) {
  // Only render posters for movies that have a TMDB poster path.
  const moviesWithPosters = includedMovies.filter((m) => m.posterPath);
  const allPosters: Array<{ posterPath: string; title: string }> = [];

  // Add background posters first (up to 2)
  const backgroundMovies = mainPosterPath
    ? moviesWithPosters.slice(0, 2)
    : moviesWithPosters.slice(1, 3);

  backgroundMovies.forEach((movie) => {
    if (movie.posterPath) {
      allPosters.push({ posterPath: movie.posterPath, title: movie.title });
    }
  });

  // Add the main poster last (on top)
  const frontPosterPath = mainPosterPath || moviesWithPosters[0]?.posterPath;
  if (frontPosterPath) {
    allPosters.push({ posterPath: frontPosterPath, title: mainTitle });
  }

  // Get positions based on total count and size
  const posterCount = Math.min(allPosters.length, 3) as 1 | 2 | 3;
  const sizePositions = POSITIONS[size];
  const positions = sizePositions[posterCount] || sizePositions[1];

  // Show overlay without hover when there are no posters to display
  const alwaysShowOverlay = allPosters.length === 0;

  const containerClass = clsx(
    size === "large" ? styles.stackContainerLarge : styles.stackContainer,
    interactive && styles.interactive,
  );

  const overlay = showOverlay ? (
    <div
      className={clsx(
        styles.overlay,
        alwaysShowOverlay && styles.overlayVisible,
      )}
    >
      <div>
        <HeadingTag className={styles.title}>{mainTitle}</HeadingTag>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  ) : null;

  // Determine position classes for hover animation
  const getPositionClass = (index: number, total: number) => {
    if (total === 1) return "";
    if (index === 0) return styles.posterBack;
    if (index === total - 1) return styles.posterFront;
    return styles.posterMiddle;
  };

  return (
    <div className={containerClass}>
      {allPosters.map((poster, index) => (
        <div
          key={poster.posterPath}
          className={clsx(
            styles.posterWrapper,
            getPositionClass(index, allPosters.length),
          )}
          style={{
            top: positions[index].top,
            left: positions[index].left,
            zIndex: index,
          }}
        >
          <PosterImage
            posterPath={poster.posterPath}
            title={poster.title}
            size={size}
            priority={priority}
          />
        </div>
      ))}

      {/* Overlay covers the full container */}
      {overlay}
    </div>
  );
}
