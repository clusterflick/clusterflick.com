"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./linked-list.module.css";

export type LinkedListItem = {
  key: string;
  href: string;
  label: string;
  detail?: string;
};

interface LinkedListProps {
  items: LinkedListItem[];
  /** When set, only this many items are shown initially with a toggle to reveal the rest */
  initialCount?: number;
  /** Label for the "show all" toggle, e.g. "Show all 12 nearby venues" */
  showAllLabel?: string;
}

export default function LinkedList({
  items,
  initialCount,
  showAllLabel,
}: LinkedListProps) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = initialCount != null && items.length > initialCount;

  return (
    <>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li
            key={item.key}
            className={styles.item}
            hidden={hasMore && !showAll && index >= initialCount}
          >
            <Link href={item.href} className={styles.link}>
              {item.label}
            </Link>
            {item.detail && (
              <span className={styles.detail}>{item.detail}</span>
            )}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button className={styles.toggle} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : showAllLabel || `Show all ${items.length}`}
        </button>
      )}
    </>
  );
}
