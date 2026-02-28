import Link from "next/link";
import type React from "react";
import styles from "./link-grid.module.css";

export type LinkGridItem = {
  key: string;
  href: string;
  label: string;
  /** Optional count badge displayed to the right of the label. */
  count?: string | number;
};

interface LinkGridProps {
  items: LinkGridItem[];
  /**
   * Minimum column width in pixels. Columns are auto-filled to fill the
   * available width. Defaults to 220.
   */
  minItemWidth?: number;
}

/**
 * `LinkGrid` renders a responsive multi-column grid of labelled links, each
 * with an optional count badge. Use it for large flat lists of navigable items
 * (venues, boroughs) where a compact grid layout helps the user scan quickly.
 *
 * **When to use:**
 * - Listing venues grouped by category (Venues page).
 * - Listing London boroughs (London Cinemas page).
 * - Any flat list of 10+ links that benefits from multi-column layout.
 *
 * **When NOT to use:**
 * - Short lists where a single column reads more naturally — use `LinkedList`
 *   instead (it also supports an optional detail string and "Show all" toggle).
 * - Lists that need rich card content — use `CardGrid` + `LinkCard`.
 */
export default function LinkGrid({ items, minItemWidth = 220 }: LinkGridProps) {
  return (
    <ul
      className={styles.grid}
      style={
        {
          "--link-grid-min-item-width": `${minItemWidth}px`,
        } as React.CSSProperties
      }
    >
      {items.map((item) => (
        <li key={item.key}>
          <Link href={item.href} className={styles.link}>
            <span className={styles.label} data-testid="link-grid-label">
              {item.label}
            </span>
            {item.count != null && item.count !== 0 && (
              <span className={styles.count}>{item.count}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
