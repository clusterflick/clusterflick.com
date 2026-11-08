"use client";

import { BookmarkIcon } from "@/components/icons";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import styles from "./updates.module.css";

/**
 * "On your watchlist", after a film's title in More showings: the text-only
 * twin of the poster markers on the new films above, in their yellow and with
 * their icon, so a watchlist film reads the same in either section.
 *
 * Nothing until a signed-in reader's lists have loaded, so the static HTML is
 * unchanged.
 */
export default function WatchlistTag({ movieId }: { movieId: string }) {
  const { status, lists } = useUserContext();
  if (status !== "signed-in" || !lists?.[UserListId.Watchlist][movieId]) {
    return null;
  }

  return (
    <span className={styles.watchlistTag}>
      <BookmarkIcon size={11} filled />
      On your watchlist
    </span>
  );
}
