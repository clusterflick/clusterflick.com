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
 * The countdown is a CSS animation, and its end is the expiry: pausing it
 * while the tile is hovered or holds keyboard focus pauses the timer with it, so
 * nobody loses the undo while reaching for it.
 */
export default function RemovedPosterTile({
  title,
  message,
  duration = 8000,
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
