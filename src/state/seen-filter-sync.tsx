"use client";

import { useEffect } from "react";
import { FilterId } from "@/lib/filters";
import { UserListId } from "@/lib/user-lists";
import { useFilterConfig } from "@/state/filter-config-context";
import { useUserContext } from "@/state/user-context";

/**
 * Keeps the hide-seen filter's ids equal to the reader's Seen list while it is
 * switched on, so marking a film seen hides it at once, and switches the filter
 * off on sign out, since the list it stood for is no longer the reader's.
 *
 * Renders nothing. It sits inside both providers because `UserProvider` is
 * nested in `FilterConfigProvider`, so neither can read the other.
 *
 * While the lists are still loading the stored ids are left alone: they came
 * from this session, and clearing them would flash the seen films back in on
 * every page load.
 */
export function SeenFilterSync() {
  const { status, lists } = useUserContext();
  const { filterState, setHideSeen } = useFilterConfig();
  const hidden = filterState[FilterId.HideSeen];

  useEffect(() => {
    if (hidden === null) return;
    if (status === "signed-out" || status === "unavailable") {
      setHideSeen(null);
      return;
    }
    if (status !== "signed-in" || !lists) return;

    const seenIds = Object.keys(lists[UserListId.Seen]);
    const current = new Set(hidden);
    const unchanged =
      seenIds.length === current.size && seenIds.every((id) => current.has(id));
    if (!unchanged) setHideSeen(seenIds);
  }, [hidden, status, lists, setHideSeen]);

  return null;
}
