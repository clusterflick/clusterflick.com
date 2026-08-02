import type { ReactNode } from "react";
import styles from "./section-heading.module.css";

interface SectionHeadingProps {
  children: ReactNode;
  /** Replaces the default styling entirely, for a section that needs its own. */
  className?: string;
}

/**
 * The small uppercase heading above a sub-section of a detail page — "Cast",
 * "Playing at", "Appears on", "Screening as part of".
 *
 * **When to use:**
 * - Labelling a block within a page that already has a main heading, so the
 *   run of sections reads as one consistent set.
 *
 * **When NOT to use:**
 * - A page's main title — use `OutlineHeading`.
 * - A titled content block with its own container — use `ContentSection`.
 */
export default function SectionHeading({
  children,
  className,
}: SectionHeadingProps) {
  return <h3 className={className ?? styles.heading}>{children}</h3>;
}
