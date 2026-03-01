import type { ReactNode } from "react";
import styles from "./columns-layout.module.css";

interface ColumnsLayoutProps {
  /** Content for the left (main) column. Pass null to render sidebar only. */
  main: ReactNode;
  /** Content for the right (sidebar) column. Pass null to render main only. */
  sidebar: ReactNode;
}

/**
 * A two-column responsive layout with a main content area and a sidebar.
 * Stacks vertically on mobile, side-by-side at 768px+.
 * The sidebar resets ContentSection margin and uses a tighter gap.
 *
 * **When to use:**
 * - Detail pages that pair descriptive content with a sidebar
 *   (e.g. venue pages, borough pages, festival/film-club detail pages).
 *
 * **When NOT to use:**
 * - Full-width content sections — use ContentSection directly.
 * - Grids of cards — use CardGrid or a custom grid.
 */
export default function ColumnsLayout({ main, sidebar }: ColumnsLayoutProps) {
  return (
    <div className={styles.columns}>
      {main && <div className={styles.main}>{main}</div>}
      {sidebar && <div className={styles.sidebar}>{sidebar}</div>}
    </div>
  );
}
