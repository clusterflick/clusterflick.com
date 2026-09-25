"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Movie } from "@/types";
import { BookmarkIcon, EyeIcon } from "@/components/icons";
import { useUserContext, type UserContextType } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import styles from "./poster-status-markers.module.css";

/**
 * A reader's status that can be marked on a poster. Each is independent — a
 * film seen and then put back on the watchlist carries both — so markers stack
 * rather than compete for the corner. A new status (an alert, say) is one more
 * entry here; the stack makes room for it.
 */
export interface PosterStatusMarker {
  id: string;
  label: string;
  icon: ReactNode;
  isOn: (context: UserContextType, movieId: Movie["id"]) => boolean;
}

/** Same icons, in their "on" state, as the film page's `UserListButtons`. */
const MARKERS: PosterStatusMarker[] = [
  {
    id: UserListId.Watchlist,
    label: "On your watchlist",
    icon: <BookmarkIcon size={12} filled />,
    isOn: ({ lists }, movieId) => !!lists?.[UserListId.Watchlist][movieId],
  },
  {
    id: UserListId.Seen,
    label: "Seen",
    icon: <EyeIcon size={12} closed />,
    isOn: ({ lists }, movieId) => !!lists?.[UserListId.Seen][movieId],
  },
];

interface PosterStatusMarkersProps {
  movieId: Movie["id"];
}

/**
 * Small markers for the reader's own status on a film — on their watchlist,
 * seen — drawn in a poster's top-right corner. Several overlap like a pile of
 * chips and fan out when the enclosing link is hovered or focused.
 *
 * Renders nothing unless signed in with lists loaded, so the static HTML (always
 * signed out) is unaffected and signed-out visitors never see an empty slot.
 * The lists are already held by `UserProvider` on every page for a signed-in
 * reader, so this costs no extra load. Indicators only: changing a list stays
 * on the film's own page.
 *
 * Place it as a direct child of the poster's link (or tile), which must be
 * positioned: hovering or focusing that parent is what fans the stack out.
 * A parent can move the stack down with `--status-markers-top`.
 */
export default function PosterStatusMarkers({
  movieId,
}: PosterStatusMarkersProps) {
  const context = useUserContext();
  if (context.status !== "signed-in" || !context.lists) return null;

  const active = MARKERS.filter((marker) => marker.isOn(context, movieId));
  if (active.length === 0) return null;

  return (
    <span className={styles.stack}>
      {active.map((marker, index) => (
        <span
          key={marker.id}
          role="img"
          aria-label={marker.label}
          className={styles.marker}
          style={{ "--index": index } as CSSProperties}
        >
          {marker.icon}
        </span>
      ))}
    </span>
  );
}
