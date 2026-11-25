"use client";

import { useEffect, useRef } from "react";
import styles from "./occasion-card.module.css";

export interface RemovedOccasionCardProps {
  title: string;
  /** What happened, drawn where the card was — "Removed from Watchlist". */
  message: string;
  /** How long the undo is offered for, in milliseconds. */
  duration?: number;
  onUndo: () => void;
  /** Called once the time runs out, to drop the placeholder. */
  onExpire: () => void;
}

/**
 * The space an `OccasionCard` leaves behind while its removal can still be
 * undone, as `RemovedPosterTile` is for a tile: the card's footprint as an
 * outline, so the row doesn't close up under the pointer, with **Undo** where
 * the card's own control was. In a row it stretches to its neighbours'
 * height.
 *
 * The countdown is a CSS animation whose end is the expiry. It pauses on
 * keyboard focus only, for `RemovedPosterTile`'s reasons.
 */
export default function RemovedOccasionCard({
  title,
  message,
  duration = 3000,
  onUndo,
  onExpire,
}: RemovedOccasionCardProps) {
  const undoRef = useRef<HTMLButtonElement>(null);

  // The card replaces the button that was just pressed, so focus would
  // otherwise fall back to the page.
  useEffect(() => {
    if (document.activeElement === document.body) undoRef.current?.focus();
  }, []);

  return (
    <div className={styles.removed}>
      <span className={styles.removedMessage} role="status">
        {message}
      </span>
      <span className={styles.removedTitle}>{title}</span>
      <button
        ref={undoRef}
        type="button"
        className={styles.undo}
        onClick={onUndo}
        aria-label={`Undo: ${message.toLowerCase()} — ${title}`}
      >
        Undo
      </button>
      <span
        className={styles.countdown}
        style={{ animationDuration: `${duration}ms` }}
        onAnimationEnd={onExpire}
        aria-hidden
      />
    </div>
  );
}
