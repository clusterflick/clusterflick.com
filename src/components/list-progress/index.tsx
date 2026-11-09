"use client";

import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import { getListProgress } from "@/lib/user-lists/list-progress";
import styles from "./list-progress.module.css";

const RADIUS = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface ListProgressProps {
  /** The list's films by TMDB id (`getMovieListTmdbIds`). */
  tmdbIds: string[];
  /**
   * `ring` for a card: a progress ring and "112 of 250 seen". `line` for a
   * list's own page: a sentence, with how many unseen films are showing.
   */
  variant?: "ring" | "line";
  /** The list's films showing now, for the line's "4 you haven't seen". */
  showingIds?: string[];
}

/**
 * How far through a film list the signed-in reader is, from their Seen list.
 * Renders nothing until they're known to be signed in with lists loaded, so
 * the static page never changes; nothing for a list with no films to count.
 */
export default function ListProgress({
  tmdbIds,
  variant = "ring",
  showingIds,
}: ListProgressProps) {
  const { status, lists } = useUserContext();
  if (status !== "signed-in" || !lists || tmdbIds.length === 0) return null;

  const seenList = lists[UserListId.Seen];
  const { seen, total } = getListProgress(tmdbIds, seenList);
  const counts = `${seen.toLocaleString("en-GB")} of ${total.toLocaleString("en-GB")}`;

  if (variant === "line") {
    const unseenShowing = (showingIds ?? []).filter(
      (id) => !(id in seenList),
    ).length;
    return (
      <p className={styles.line}>
        You&apos;ve seen <strong>{counts}</strong> films on this list
        {seen === total
          ? ", every one."
          : unseenShowing > 0
            ? `. ${unseenShowing} you haven't seen ${unseenShowing === 1 ? "is" : "are"} showing.`
            : "."}
      </p>
    );
  }

  const share = total > 0 ? seen / total : 0;
  return (
    <span className={styles.ring}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        aria-hidden="true"
        className={styles.svg}
      >
        <circle cx="18" cy="18" r={RADIUS} className={styles.track} />
        <circle
          cx="18"
          cy="18"
          r={RADIUS}
          className={styles.progress}
          strokeDasharray={`${share * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        />
      </svg>
      <span>
        <strong>{counts}</strong> seen
      </span>
    </span>
  );
}
