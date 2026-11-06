import clsx from "clsx";
import styles from "./release-dot.module.css";

export interface ReleaseDotProps {
  /** The release is older than `STALE_AFTER_HOURS`: a hollow yellow ring */
  stale?: boolean;
  className?: string;
}

/**
 * The release-status dot: filled green and gently pulsing while the data is
 * fresh, a hollow yellow ring once it is stale, so the two read apart without
 * colour as well. Sized in `em`, so it scales with the text it sits in.
 *
 * It is an inline element centred on the x-height, so it goes first in the
 * same line box as its text and travels with the first line however that line
 * is aligned. Set inside a flex row instead, it sat on the far left of a
 * wrapped, centred paragraph rather than beside its first word.
 */
export default function ReleaseDot({
  stale = false,
  className,
}: ReleaseDotProps) {
  return (
    <span
      className={clsx(styles.dot, stale && styles.stale, className)}
      aria-hidden="true"
    />
  );
}
