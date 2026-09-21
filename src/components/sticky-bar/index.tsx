import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "./sticky-bar.module.css";

interface StickyBarProps {
  children: ReactNode;
  /** For the page's own spacing around the bar (margins only). */
  className?: string;
}

/**
 * A full-width controls bar that sticks beneath the fixed 63px `MainHeader`,
 * opaque so content scrolls away under it. The catalogue's search row and the
 * planner's day stepper both sit in one, so moving between the two views keeps
 * the controls in the same place.
 *
 * Place it outside any padded content column: it supplies its own gutters.
 */
export default function StickyBar({ children, className }: StickyBarProps) {
  return <div className={clsx(styles.bar, className)}>{children}</div>;
}
