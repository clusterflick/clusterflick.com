"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Button from "@/components/button";
import styles from "./pill-list.module.css";

interface PillListProps<T> {
  /** Small uppercase heading above the list (e.g. "Cast", "Playing at"). */
  title: string;
  /** Items to render as pills. */
  items: T[];
  /** Max pills shown on desktop before a "+N more" toggle. Omit to show all. */
  maxVisible?: number;
  /**
   * Max pills shown on mobile (≤768px). When set, a responsive mobile/desktop
   * pair is rendered; otherwise a single list is used at all widths.
   */
  maxVisibleMobile?: number;
  /** Renders a single item's pill content. Defaults to rendering it as a string. */
  renderItem?: (item: T) => ReactNode;
  /** Plural noun used in the toggle's aria-label. Defaults to the lowercased title. */
  itemNoun?: string;
}

export default function PillList<T = string>({
  title,
  items,
  maxVisible,
  maxVisibleMobile,
  renderItem = (item) => item as ReactNode,
  itemNoun,
}: PillListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const noun = itemNoun ?? title.toLowerCase();

  // Expanding/collapsing changes the page height. A window-scrolled virtualised
  // list below this component (the movie showings list) caches its document
  // offset and only recomputes on scroll/resize — so without a nudge it renders
  // stale items and leaves a blank band until the next scroll. Dispatch a resize
  // after the toggle commits so it recalculates immediately.
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    window.dispatchEvent(new Event("resize"));
  }, [isExpanded]);

  const renderList = (max: number | undefined) => {
    const shouldTruncate = max != null && items.length > max;
    const visibleItems =
      shouldTruncate && !isExpanded ? items.slice(0, max) : items;
    const remainingCount = max != null ? items.length - max : 0;

    return (
      <div className={styles.list}>
        {visibleItems.map((item, index) => (
          <span key={index} className={styles.pill}>
            {renderItem(item)}
          </span>
        ))}
        {shouldTruncate && !isExpanded && (
          <Button
            variant="link"
            onClick={() => setIsExpanded(true)}
            aria-expanded="false"
            aria-label={`Show ${remainingCount} more ${noun}`}
          >
            +{remainingCount} more
          </Button>
        )}
        {shouldTruncate && isExpanded && (
          <Button
            variant="link"
            onClick={() => setIsExpanded(false)}
            aria-expanded="true"
            aria-label={`Show fewer ${noun}`}
          >
            Show less
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 className={styles.title}>{title}</h3>
      {maxVisibleMobile == null ? (
        renderList(maxVisible)
      ) : (
        <>
          <div className={styles.mobile}>{renderList(maxVisibleMobile)}</div>
          <div className={styles.desktop}>{renderList(maxVisible)}</div>
        </>
      )}
    </div>
  );
}
