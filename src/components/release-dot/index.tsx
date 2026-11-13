import clsx from "clsx";
import styles from "./release-dot.module.css";

export interface ReleaseDotProps {
  /** The release is older than `STALE_AFTER_HOURS`: a hollow yellow ring */
  stale?: boolean;
  /** Not live (a private profile): a still pink dot */
  off?: boolean;
  className?: string;
}

/**
 * The status dot: filled green and gently pulsing while something is live
 * (the data is fresh, a profile is public), a hollow yellow ring once data is
 * stale, and a still pink dot for something that is off (a private profile),
 * so they read apart without colour as well. Sized in `em`, so it scales with
 * the text it sits in.
 *
 * It is an inline element centred on the x-height, so it goes first in the
 * same line box as its text and travels with the first line however that line
 * is aligned. Set inside a flex row instead, it sat on the far left of a
 * wrapped, centred paragraph rather than beside its first word.
 */
export default function ReleaseDot({
  stale = false,
  off = false,
  className,
}: ReleaseDotProps) {
  return (
    <span
      className={clsx(
        styles.dot,
        stale && styles.stale,
        off && styles.off,
        className,
      )}
      aria-hidden="true"
    />
  );
}
