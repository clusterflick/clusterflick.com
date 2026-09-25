"use client";

import { useEffect, useRef } from "react";
import styles from "./poster-tile.module.css";

export interface RemovedPosterTileProps {
  title: string;
  /** What happened, drawn where the poster was — "Removed from Watchlist". */
  message: string;
  /** How long the undo is offered for, in milliseconds. */
  duration?: number;
  onUndo: () => void;
  /** Called once the time runs out, to drop the placeholder. */
  onExpire: () => void;
}

/**
 * The space a `PosterTile` leaves behind while its removal can still be
 * undone. It keeps the tile's footprint, so nothing shifts under the pointer,
 * and puts **Undo** where the tile's own control was — a mistaken click is put
 * right by clicking again in the same place.
 *
 * The countdown is a CSS animation, and its end is the expiry. It is short,
 * and it doesn't pause on hover: the pointer is resting on Undo the moment
 * the tile appears, so pausing there held it open until the reader moved
 * away. It pauses on keyboard focus only — focus is moved to Undo, and
 * letting it expire underneath would drop a keyboard reader back to the top.
 */
export default function RemovedPosterTile({
  title,
  message,
  duration = 3000,
  onUndo,
  onExpire,
}: RemovedPosterTileProps) {
  const undoRef = useRef<HTMLButtonElement>(null);

  // The tile replaces the button that was just pressed, so focus would
  // otherwise fall back to the page. It lands on Undo instead, which is where
  // a keyboard reader would want it anyway.
  useEffect(() => {
    if (document.activeElement === document.body) undoRef.current?.focus();
  }, []);

  return (
    <li className={styles.tile}>
      <div className={styles.removed}>
        <span className={styles.removedMessage} role="status">
          {message}
        </span>
        <span
          className={styles.countdown}
          style={{ animationDuration: `${duration}ms` }}
          onAnimationEnd={onExpire}
          aria-hidden
        />
      </div>
      <h4 className={styles.title}>{title}</h4>
      <div className={styles.action}>
        <button
          ref={undoRef}
          type="button"
          className={styles.undo}
          onClick={onUndo}
          aria-label={`Undo: ${message.toLowerCase()} — ${title}`}
        >
          Undo
        </button>
      </div>
    </li>
  );
}
