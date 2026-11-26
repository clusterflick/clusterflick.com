"use client";

import {
  Children,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import clsx from "clsx";
import Button from "@/components/button";
import { ChevronDownIcon } from "@/components/icons";
import { useElementWidth } from "@/hooks/use-element-width";
import styles from "./card-deck.module.css";

export interface CardDeckProps {
  /** The cards, each with a key. Each is drawn in a list item of its own. */
  children: ReactNode;
  /** What the cards are, for the buttons' names: "Don't miss", "My Venues". */
  label: string;
  /** The noun counted on the button, singular and plural: ["venue", "venues"]. */
  noun: [string, string];
  /** The narrowest a column may get; as many fit across as will. */
  minColumnWidth: number;
  /** Rows drawn in full before the deck. */
  openRows?: number;
  /**
   * The fewest cards drawn in full, whatever the columns: on a phone, one
   * column of `openRows` cards would leave too little to go on.
   */
  minOpen?: number;
  /**
   * Opens the deck whenever this turns true, as `ExpandableSection`'s does —
   * for the editing buttons, which a closed deck would hide. Never closes it.
   */
  expandWhen?: boolean;
}

const GAP = 16;

/**
 * A grid of cards that shows its first rows in full and tucks the next row
 * under them as the top of a deck, fading out, with "Show 7 more" over it.
 * Every card drawn in full can be read whole, which a deck of half-covered
 * cards couldn't offer, while the deck says how much more there is without a
 * horizontal scroll. A list that fits, or would hide only one card, is drawn
 * whole with no deck.
 *
 * **When to use:** a list of cards that grows long, mostly on a phone, where
 * the first few are what most readers want: the watchlist's Don't miss, My
 * Venues, a reader's progress through the film lists.
 *
 * **When NOT to use:** posters — use `PosterStack`; a list whose every item
 * matters equally and is short — a plain grid.
 */
export default function CardDeck({
  children,
  label,
  noun,
  minColumnWidth,
  openRows = 2,
  minOpen = 0,
  expandWhen = false,
}: CardDeckProps) {
  const items = Children.toArray(children);
  const [measureRef, width] = useElementWidth<HTMLDivElement>();
  const [expanded, setExpanded] = useState(expandWhen);
  // Adjusted during render, as ExpandableSection's, so the deck never paints
  // closed for a frame before opening.
  const [lastExpandWhen, setLastExpandWhen] = useState(expandWhen);
  if (expandWhen !== lastExpandWhen) {
    setLastExpandWhen(expandWhen);
    if (expandWhen) setExpanded(true);
  }
  const rootRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  // Measured, so the rows the deck counts are the rows the grid draws.
  const columns = width
    ? Math.max(1, Math.floor((width + GAP) / (minColumnWidth + GAP)))
    : 1;
  const open = Math.max(columns * openRows, minOpen);
  // Hiding a single card behind a click costs more than drawing it.
  const collapsible = items.length > open + 1;
  const closed = collapsible && !expanded;
  const hidden = items.length - open;
  const count = `${hidden.toLocaleString("en-GB")} more ${hidden === 1 ? noun[0] : noun[1]}`;

  const expand = () => {
    setExpanded(true);
    // The button goes, so focus moves to the first card it revealed.
    requestAnimationFrame(() => {
      const first = rootRef.current?.querySelectorAll<HTMLElement>(
        `.${styles.item}`,
      )[open];
      first?.focus({ preventScroll: true });
    });
  };

  const collapse = () => {
    setExpanded(false);
    requestAnimationFrame(() => {
      // Closing from the foot of a long list leaves the deck above the screen;
      // bring it back rather than leave the reader somewhere else on the page.
      const top = rootRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) rootRef.current?.scrollIntoView({ block: "start" });
      moreRef.current?.focus({ preventScroll: true });
    });
  };

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        measureRef(node);
      }}
      className={styles.root}
    >
      <ul
        id={listId}
        className={clsx(styles.grid, closed && styles.closed)}
        style={{ "--columns": columns } as CSSProperties}
        aria-label={label}
      >
        {items.map((item, index) => {
          const peek = closed && index >= open && index < open + columns;
          const buried = closed && index >= open + columns;
          return (
            <li
              key={(item as { key?: string }).key ?? index}
              className={clsx(
                styles.item,
                peek && styles.peek,
                buried && styles.buried,
              )}
              // Drawn as the deck's top, not something to reach.
              inert={peek || undefined}
              aria-hidden={peek || undefined}
              tabIndex={-1}
            >
              {item}
            </li>
          );
        })}
      </ul>
      {closed && (
        <div className={styles.more}>
          <button
            ref={moreRef}
            type="button"
            className={styles.moreButton}
            onClick={expand}
            aria-expanded={false}
            aria-controls={listId}
            aria-label={`${label}: show ${count}`}
          >
            Show {count}
            <ChevronDownIcon size={14} aria-hidden="true" />
          </button>
        </div>
      )}
      {collapsible && expanded && (
        <div className={styles.collapse}>
          <Button
            variant="secondary"
            size="sm"
            onClick={collapse}
            aria-expanded
            aria-controls={listId}
            aria-label={`${label}: show fewer`}
          >
            Show fewer
          </Button>
        </div>
      )}
    </div>
  );
}
