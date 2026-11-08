"use client";

import { useEffect, useMemo } from "react";
import { useUserContext } from "@/state/user-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { UserListId } from "@/lib/user-lists";
import { syncFilmDetails } from "@/lib/user-lists/film-details-sync";

/**
 * Keeps the reader's film details in line with their lists while the page is
 * open — see `syncFilmDetails`. Silent: what it fills in is for the lists'
 * stats and filters, and stopping part way loses nothing, as the next visit
 * carries on.
 *
 * Waits for the listings to finish loading, since a film found there costs no
 * lookup. It runs again when the set of listed films changes, which catches a
 * film added from a TMDB search or a departed page, neither of which has
 * details to save on add.
 */
export function useFilmDetailsSync() {
  const { status, lists, getIdToken, readFilmDetails, writeFilmDetails } =
    useUserContext();
  const { movies, metaData, isLoading, hasAttemptedLoad } = useCinemaData();
  const ready = status === "signed-in" && !!lists && hasAttemptedLoad;

  // A key rather than the lists themselves, so a list edit that changes no
  // film (a re-add, say) doesn't start another run.
  const listedKey = useMemo(() => {
    if (!lists) return "";
    const ids = new Set(
      Object.values(UserListId).flatMap((id) => Object.keys(lists[id])),
    );
    return [...ids].sort().join(",");
  }, [lists]);

  useEffect(() => {
    if (!ready || isLoading || !metaData || !listedKey) return;
    const controller = new AbortController();
    syncFilmDetails({
      listedIds: listedKey.split(","),
      movies,
      people: metaData.people,
      getIdToken,
      read: readFilmDetails,
      write: writeFilmDetails,
      signal: controller.signal,
    }).catch((error) => {
      if (!controller.signal.aborted) {
        console.error("Failed to sync film details", error);
      }
    });
    return () => controller.abort();
    // `movies` is complete once loading has finished, and a new copy of it
    // alone shouldn't restart a run part way through its lookups.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    isLoading,
    metaData,
    listedKey,
    getIdToken,
    readFilmDetails,
    writeFilmDetails,
  ]);
}
