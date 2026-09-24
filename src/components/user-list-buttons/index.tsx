"use client";

import { useState } from "react";
import type { Movie } from "@/types";
import Button, { ButtonLink } from "@/components/button";
import { TickIcon } from "@/components/icons";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import styles from "./user-list-buttons.module.css";

const LABELS: Record<UserListId, string> = {
  [UserListId.Watchlist]: "Want to see",
  [UserListId.Seen]: "Seen it",
};

interface UserListButtonsProps {
  /** What the lists keep about the film — see `UserListEntry`. */
  movie: Pick<Movie, "id" | "title" | "year" | "posterPath">;
}

/**
 * Toggles for putting a film on the reader's watchlist or seen list.
 *
 * Signed out (or not yet known to be signed in), each button is a link to
 * `/personalise`, which is how most readers will find out personalisation
 * exists. Signed in, they're toggle buttons. Either way the labels stay the
 * same, so the static HTML (always rendered signed out) barely moves when the
 * sign-in state resolves after hydration. When the build has no Firebase
 * config, they don't render at all.
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
            <ButtonLink key={listId} href="/personalise" variant="secondary">
              {LABELS[listId]}
            </ButtonLink>
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
            <Button
              key={listId}
              variant={isOn ? "primary" : "secondary"}
              aria-pressed={isOn}
              // Lists still loading: the state isn't known, so neither is
              // what a press would do.
              disabled={!lists}
              onClick={() => toggle(listId, isOn)}
              className={styles.button}
            >
              {isOn && <TickIcon size={16} aria-hidden="true" />}
              {LABELS[listId]}
            </Button>
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
