"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/button";
import styles from "./updates.module.css";

/**
 * Shows the first `initialCount` entries of a list until asked for the rest.
 *
 * Entries arrive already rendered rather than as data, because the things being
 * capped are poster tiles built from server components. Slicing them here keeps
 * the overflow out of the DOM — a run announcing a whole season contributed
 * over a hundred tiles, several thousand elements, to a page that opens on the
 * first two rows of them — while the entries themselves stay in the payload, so
 * revealing the rest needs no fetch and loses nothing.
 *
 * As with the venue lists, there is no way back: once a reader has asked to see
 * everything, hiding it again only takes away what they asked for.
 */
export default function CappedList({
  items,
  initialCount,
  showAllLabel,
  className,
}: {
  items: ReactNode[];
  initialCount: number;
  /** e.g. "Show all 109 new films" */
  showAllLabel: string;
  className?: string;
}) {
  const [showAll, setShowAll] = useState(false);

  // Collapsing to hide a single entry costs a click and saves nothing, so the
  // toggle only appears once it hides at least two.
  const isCollapsed = !showAll && items.length > initialCount + 1;
  const visible = isCollapsed ? items.slice(0, initialCount) : items;

  return (
    <>
      <ul className={className}>{visible}</ul>
      {isCollapsed && (
        // Outlined rather than a link: it sits between a poster grid and a
        // section of blue title links, where a bare link read as one more
        // entry in the list rather than the way to open the rest of it.
        <div className={styles.showMore}>
          <Button variant="secondary" onClick={() => setShowAll(true)}>
            {showAllLabel}
          </Button>
        </div>
      )}
    </>
  );
}
