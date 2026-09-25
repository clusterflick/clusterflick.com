"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { Movie } from "@/types";
import { BookmarkIcon, EyeIcon } from "@/components/icons";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import styles from "./user-list-buttons.module.css";

const LISTS: Record<
  UserListId,
  { label: string; icon: (isOn: boolean) => ReactNode }
> = {
  [UserListId.Watchlist]: {
    label: "Want to see",
    icon: (isOn) => <BookmarkIcon size={16} filled={isOn} />,
  },
  [UserListId.Seen]: {
    label: "Seen it",
    icon: (isOn) => <EyeIcon size={16} closed={isOn} />,
  },
};

interface UserListButtonsProps {
  /** What the lists keep about the film — see `UserListEntry`. */
  movie: Pick<Movie, "id" | "title" | "year" | "posterPath">;
}

/**
 * Toggles for putting a film on the reader's watchlist or seen list, sized to
 * sit under the film's poster.
 *
 * Signed out (or not yet known to be signed in), each is a link to
 * `/personalise`, which is how most readers will find out personalisation
 * exists. Signed in, they're toggle buttons. Either way the labels stay the
 * same, so the static HTML (always rendered signed out) doesn't move when the
 * sign-in state resolves after hydration. When the build has no Firebase
 * config, they don't render at all.
 *
 * Styled after `Chip` — a quiet pill, tinted when on — rather than `Button`,
 * whose blue outline disappeared among the hero's other blue controls. Not
 * `Chip` itself: that is a checkbox, which can neither carry an icon nor be the
 * link these need to be when signed out.
 */
export default function UserListButtons({ movie }: UserListButtonsProps) {
  const { status, lists, addToList, removeFromList } = useUserContext();
  const [error, setError] = useState(false);

  if (status === "unavailable") return null;

  const listIds = Object.values(UserListId);

  if (status !== "signed-in") {
    return (
      <div className={styles.wrapper}>
        <div className={styles.buttons}>
          {listIds.map((listId) => (
            <Link key={listId} href="/personalise" className={styles.button}>
              {LISTS[listId].icon(false)}
              {LISTS[listId].label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const toggle = async (listId: UserListId, isOn: boolean) => {
    setError(false);
    try {
      if (isOn) {
        await removeFromList(listId, movie.id);
      } else {
        await addToList(listId, movie);
      }
    } catch (caught) {
      console.error("Failed to update list", caught);
      setError(true);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.buttons}>
        {listIds.map((listId) => {
          const isOn = !!lists?.[listId][movie.id];
          return (
            <button
              key={listId}
              type="button"
              aria-pressed={isOn}
              // Lists still loading: the state isn't known, so neither is
              // what a press would do.
              disabled={!lists}
              onClick={() => toggle(listId, isOn)}
              className={clsx(styles.button, isOn && styles.on)}
            >
              {LISTS[listId].icon(isOn)}
              {LISTS[listId].label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          That didn&apos;t save. Please try again.
        </p>
      )}
    </div>
  );
}
