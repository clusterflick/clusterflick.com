import type { ReactNode } from "react";
import Link from "next/link";
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
  /**
   * When provided, the tag renders as an internal link to this path while
   * keeping the pill appearance (no underline, subtle hover).
   */
  href?: string;
  /** Optional additional className */
  className?: string;
}

/**
 * A pill/tag for categorization, genres, and feature indicators. Display-only
 * by default; pass `href` to make it a link. For interactive selection, use the
 * Chip component instead.
 */
export default function Tag({
  children,
  color = "pink",
  size = "md",
  href,
  className = "",
}: TagProps) {
  const colorClass = styles[color];
  const sizeClass = styles[size];
  const classes = clsx(styles.tag, colorClass, sizeClass, className);

  if (href) {
    return (
      <Link href={href} className={clsx(classes, styles.link)}>
        {children}
      </Link>
    );
  }

  return <span className={classes}>{children}</span>;
}
