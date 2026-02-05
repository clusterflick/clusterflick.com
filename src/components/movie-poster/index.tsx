import Image from "next/image";
import clsx from "clsx";
import { getPosterColor } from "@/utils/get-poster-color";
import styles from "./movie-poster.module.css";

interface MoviePosterImageProps {
  title: string;
  size: "small" | "large";
  posterPath: string;
  overlay: React.ReactNode | null;
}

function MoviePosterImage({
  title,
  size,
  posterPath,
  overlay,
}: MoviePosterImageProps) {
  const dimensions =
    size === "large"
      ? { width: 342, height: 513 }
      : { width: 200, height: 300 };

  const imageSize = size === "large" ? "w500" : "w342";

  return (
    <div className={clsx(styles.poster, styles[size])}>
      <Image
        src={`https://image.tmdb.org/t/p/${imageSize}${posterPath}`}
        alt={title}
        width={dimensions.width}
        height={dimensions.height}
        priority={size === "large"}
      />
      {overlay}
    </div>
  );
}

interface TextPatternPosterProps {
  title: string;
  size: "small" | "large";
  overlay: React.ReactNode | null;
}

function TextPatternPoster({ title, size, overlay }: TextPatternPosterProps) {
  const color = getPosterColor(title);
  const displayTitle = title.toUpperCase();
  const rowCount = size === "large" ? 24 : 18;
  const offsetStep = size === "large" ? 20 : 15;

  // Create the repeating text for each row
  const repeatedText = `${displayTitle} `.repeat(8);

  return (
    <div
      className={clsx(
        styles.noPoster,
        styles[size],
        styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`],
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
  size?: "small" | "large";
  showOverlay?: boolean;
}

export default function MoviePoster({
  posterPath,
  title,
  subtitle,
  size = "small",
  showOverlay = false,
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
        <h3 className={styles.title}>{title}</h3>
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
      />
    );
  }

  return <TextPatternPoster title={title} size={size} overlay={overlay} />;
}
