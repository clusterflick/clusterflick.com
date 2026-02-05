import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "./tag.module.css";

interface TagProps {
  /** Tag content */
  children: ReactNode;
  /**
   * Color variant:
   * - "pink": Neon pink accent (default)
   * - "blue": Electric blue accent
   * - "gray": Muted gray (for disabled/inactive states)
   */
  color?: "pink" | "blue" | "gray";
  /**
   * Size variant:
   * - "md": Standard size for genre tags (default)
   * - "sm": Compact size for accessibility/feature tags
   */
  size?: "md" | "sm";
  /** Optional additional className */
  className?: string;
}

/**
 * A display-only pill/tag for categorization, genres, and feature indicators.
 * For interactive selection, use the Chip component instead.
 */
export default function Tag({
  children,
  color = "pink",
  size = "md",
  className = "",
}: TagProps) {
  const colorClass = styles[color];
  const sizeClass = styles[size];

  return (
    <span className={clsx(styles.tag, colorClass, sizeClass, className)}>
      {children}
    </span>
  );
}
