import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "./card-grid.module.css";

interface CardGridProps {
  /** Grid content */
  children: ReactNode;
  /**
   * Column size preset:
   * - "sm": Min 150px columns (compact items like ratings)
   * - "md": Min 180px columns (medium items like film posters)
   * - "lg": Min 280px columns (large items like feature cards)
   */
  size?: "sm" | "md" | "lg";
  /**
   * Gap between items:
   * - "sm": 12px gap
   * - "md": 16px gap (default)
   * - "lg": 24px gap
   */
  gap?: "sm" | "md" | "lg";
  /** Optional additional className */
  className?: string;
}

/**
 * A responsive grid layout for cards and similar items.
 * Automatically adjusts column count based on available space.
 */
export default function CardGrid({
  children,
  size = "lg",
  gap = "md",
  className = "",
}: CardGridProps) {
  const sizeClass = styles[`size-${size}`];
  const gapClass = styles[`gap-${gap}`];

  return (
    <div className={clsx(styles.grid, sizeClass, gapClass, className)}>
      {children}
    </div>
  );
}
