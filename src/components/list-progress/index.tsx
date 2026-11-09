"use client";

import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import clsx from "clsx";
import Link from "next/link";
import { getMoviesFilterUrl } from "@/lib/filters/modules/movies";
import { getListProgress } from "@/lib/user-lists/list-progress";
import styles from "./list-progress.module.css";

const RADIUS = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface ListProgressProps {
  /** The list's films by TMDB id (`getMovieListTmdbIds`). */
  tmdbIds: string[];
  /**
   * `ring` for a card: "112 of 250 seen" and a progress ring. `line` for a
   * list's own page: a sentence, with how many unseen films are showing.
   */
  variant?: "ring" | "line";
  /**
   * The list's films showing now, for the line's "4 you haven't seen", which
   * opens the catalogue on those films.
   */
  showingIds?: string[];
  className?: string;
}

/**
 * The ring alone, filled to `share` (0–1) from twelve o'clock, for a card
 * that says the counts in its own words.
 */
export function ProgressRing({ share }: { share: number }) {
  return (
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
  );
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
  className,
}: ListProgressProps) {
  const { status, lists } = useUserContext();
  if (status !== "signed-in" || !lists || tmdbIds.length === 0) return null;

  const seenList = lists[UserListId.Seen];
  const { seen, total } = getListProgress(tmdbIds, seenList);
  const counts = `${seen.toLocaleString("en-GB")} of ${total.toLocaleString("en-GB")}`;

  if (variant === "line") {
    const unseenShowing = (showingIds ?? []).filter((id) => !(id in seenList));
    return (
      <p className={clsx(styles.line, className)}>
        You&apos;ve seen <strong>{counts}</strong> films on this list
        {seen === total ? (
          ", every one."
        ) : unseenShowing.length > 0 ? (
          <>
            . {/* Into the catalogue with just those films selected. */}
            <Link href={getMoviesFilterUrl("/catalogue", unseenShowing)}>
              {unseenShowing.length} you haven&apos;t seen{" "}
              {unseenShowing.length === 1 ? "is" : "are"} showing
            </Link>
            .
          </>
        ) : (
          "."
        )}
      </p>
    );
  }

  const share = total > 0 ? seen / total : 0;
  return (
    <span className={clsx(styles.ring, className)}>
      <span>
        <strong>{counts}</strong> seen
      </span>
      <ProgressRing share={share} />
    </span>
  );
}
