"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import PosterRow from "@/components/poster-row";
import { useCinemaData } from "@/state/cinema-data-context";
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

/**
 * "From Your Watchlist" — the signed-in reader's watchlist films showing in
 * the next fortnight, favourite venues first (see `getWatchlistRow`).
 *
 * Client-only: the static HTML carries just the empty slot, so signed-out
 * readers and crawlers see the page unchanged. The slot holds the row's last
 * height until the row settles — see `watchlist-row-reservation`.
 */
export default function WatchlistRow() {
  const { status, lists, favouriteVenues } = useUserContext();
  const { movies, metaData, isLoading, hasAttemptedLoad } = useCinemaData();
  const slotRef = useRef<HTMLDivElement>(null);

  // The cinema data is fetched by DiscoverySections, beside this.
  const dataReady =
    hasAttemptedLoad && !isLoading && Object.keys(movies).length > 0;
  const signedIn = status === "signed-in";

  const watchlistIds = useMemo(
    () => (lists ? Object.keys(lists[UserListId.Watchlist]) : []),
    [lists],
  );

  const row = useMemo(
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

  // Settled once there is an answer: a row to show, or known to have none.
  // Signed out (or a stale flag) is an answer; still loading is not.
  const settled =
    row !== null || status === "signed-out" || status === "unavailable";

  // Before paint, so the reservation comes off in the same frame the row
  // lands in. An empty row measures 0, which clears the stored height.
  useLayoutEffect(() => {
    if (!settled || !slotRef.current) return;
    slotRef.current.style.removeProperty("--reserved-height");
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
