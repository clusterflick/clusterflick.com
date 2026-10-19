"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ScoredMovie } from "@/utils/get-discovery-movies";
import LoadingIndicator from "@/components/loading-indicator";
import PosterRow from "@/components/poster-row";
import { useCinemaData } from "@/state/cinema-data-context";
import { haveMoviesLoaded } from "@/utils/have-movies-loaded";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import { getMoviesFilterUrl } from "@/lib/filters/modules/movies";
import { getWatchlistRow } from "@/utils/get-discovery-movies";
import {
  WATCHLIST_ROW_HEIGHT_KEY,
  WATCHLIST_ROW_RESERVATION_SCRIPT,
  WATCHLIST_ROW_SLOT_ID,
} from "./watchlist-row-reservation";
import styles from "./page.module.css";

function storeHeight(height: number) {
  try {
    if (height > 0) {
      localStorage.setItem(WATCHLIST_ROW_HEIGHT_KEY, String(height));
    } else {
      localStorage.removeItem(WATCHLIST_ROW_HEIGHT_KEY);
    }
  } catch {}
}

/** What the row shows, so a recomputation that changes nothing is ignored. */
function getRowKey(row: ScoredMovie[]) {
  return row.map(({ movie, subtitle }) => `${movie.id}|${subtitle}`).join();
}

/**
 * "From Your Watchlist" — the signed-in reader's watchlist films showing in
 * the next fortnight, favourite venues first (see `getWatchlistRow`).
 *
 * Client-only: the static HTML carries just the empty slot, so signed-out
 * readers and crawlers see the page unchanged. The slot holds the row's last
 * height until the row settles — see `watchlist-row-reservation`.
 *
 * It needs only its own films, so it lands as soon as the chunks holding them
 * have, rather than waiting on every chunk and on the other rows being worked
 * out from them. The lists can be this browser's copy from the last visit
 * (see `UserProvider`), so for a returning reader Firebase isn't waited on
 * either.
 */
export default function WatchlistRow() {
  const { status, lists, favouriteVenues } = useUserContext();
  const { movies, metaData, isLoading, hasAttemptedLoad, loadedFiles } =
    useCinemaData();
  const slotRef = useRef<HTMLDivElement>(null);
  const [kept, setKept] = useState<{ key: string; row: ScoredMovie[] } | null>(
    null,
  );

  // Lists, from the server or cached, mean a signed-in reader (or one about to
  // be confirmed as such); signing out clears them.
  const signedIn = lists !== null;

  const watchlistIds = useMemo(
    () => (lists ? Object.keys(lists[UserListId.Watchlist]) : []),
    [lists],
  );

  // The cinema data is fetched by DiscoverySections, beside this. Ready once
  // the watchlist's own chunks are in — or loading has ended, which covers a
  // chunk that failed.
  const dataReady =
    hasAttemptedLoad &&
    metaData !== null &&
    (!isLoading || haveMoviesLoaded(metaData, loadedFiles, watchlistIds));

  const computedRow = useMemo(
    () =>
      signedIn && lists && dataReady
        ? getWatchlistRow(
            movies,
            watchlistIds,
            new Set(Object.keys(favouriteVenues ?? {})),
            { venueNames: metaData?.venues },
          )
        : null,
    [
      signedIn,
      lists,
      dataReady,
      movies,
      watchlistIds,
      favouriteVenues,
      metaData,
    ],
  );

  // Every chunk after the row's own changes `movies`, and with it the row's
  // identity but not its content. Keep the last row while it reads the same,
  // so the posters don't re-render and the height isn't re-measured (a forced
  // layout of the whole page) once per chunk.
  const key = useMemo(
    () => (computedRow ? getRowKey(computedRow) : null),
    [computedRow],
  );
  if (computedRow && key !== null && key !== kept?.key) {
    setKept({ key, row: computedRow });
  }
  const row = computedRow && key === kept?.key ? kept.row : computedRow;

  // Settled once there is an answer: a row to show, or known to have none.
  // Signed out (or a stale flag) is an answer; still loading is not.
  const settled =
    row !== null || status === "signed-out" || status === "unavailable";

  // Before paint, so the reservation comes off in the same frame the row
  // lands in. An empty row measures 0, which clears the stored height.
  useLayoutEffect(() => {
    if (!settled || !slotRef.current) return;
    slotRef.current.style.removeProperty("--reserved-height");
    slotRef.current.removeAttribute("data-reserved");
    if (signedIn) storeHeight(slotRef.current.offsetHeight);
  }, [settled, signedIn, row]);

  return (
    <>
      <div
        id={WATCHLIST_ROW_SLOT_ID}
        ref={slotRef}
        className={styles.watchlistSlot}
        // The reservation script sets a style React doesn't know about.
        suppressHydrationWarning
      >
        {/* Shown by CSS only while the slot is reserved. */}
        {!settled && (
          <LoadingIndicator
            size="sm"
            message="Loading your watchlist…"
            className={styles.watchlistLoading}
          />
        )}
        {row && (
          <PosterRow
            title="From Your Watchlist"
            intro="Films you want to see, showing in the next fortnight — at your venues first."
            movies={row}
            seeAllHref={getMoviesFilterUrl("/catalogue", watchlistIds)}
            seeAllLabel="Explore watchlist"
            showAll
          />
        )}
      </div>
      <script
        dangerouslySetInnerHTML={{ __html: WATCHLIST_ROW_RESERVATION_SCRIPT }}
      />
    </>
  );
}
