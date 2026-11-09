"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import LoadingIndicator from "@/components/loading-indicator";
import PosterRow from "@/components/poster-row";
import { useCinemaData } from "@/state/cinema-data-context";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import { FilterId } from "@/lib/filters/types";
import type { FilmDetailsData } from "@/lib/user-lists/film-details";
import {
  getFavouriteDirectors,
  getFavouriteDirectorsRow,
} from "@/utils/get-discovery-movies";
import { getPeopleFilterUrl } from "@/utils/get-person-filter-url";
import {
  DIRECTORS_ROW_HEIGHT_KEY,
  DIRECTORS_ROW_RESERVATION_SCRIPT,
  DIRECTORS_ROW_SLOT_ID,
  storeRowHeight,
} from "./watchlist-row-reservation";
import styles from "./page.module.css";

/**
 * "From Directors You Love" — films in the next fortnight by directors the
 * signed-in reader has seen two or more films by (see
 * `getFavouriteDirectorsRow`), under the watchlist row.
 *
 * Client-only, as the watchlist row is: the static HTML carries the empty
 * slot, which holds the row's last height until it settles. Favourites come
 * from the film details document, which the user context reads once a
 * session; a reader whose details can't be read gets no row rather than an
 * error, since the row is a suggestion.
 */
export default function DirectorsRow() {
  const { status, lists, readFilmDetails } = useUserContext();
  const { movies, isLoading, hasAttemptedLoad } = useCinemaData();
  const [details, setDetails] = useState<FilmDetailsData | null>(null);
  const [detailsFailed, setDetailsFailed] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);

  // The cinema data is fetched by DiscoverySections, beside this.
  const dataReady =
    hasAttemptedLoad && !isLoading && Object.keys(movies).length > 0;
  const signedIn = status === "signed-in";
  const hasSeen = !!lists && Object.keys(lists[UserListId.Seen]).length > 0;

  useEffect(() => {
    if (!signedIn || !hasSeen) return;
    let cancelled = false;
    readFilmDetails().then(
      (loaded) => !cancelled && setDetails(loaded),
      (error) => {
        console.error("Failed to load film details", error);
        if (!cancelled) setDetailsFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [signedIn, hasSeen, readFilmDetails]);

  const row = useMemo(() => {
    if (!signedIn || !lists || !details || !dataReady) return null;
    const seen = lists[UserListId.Seen];
    const favourites = getFavouriteDirectors(
      Object.keys(seen).flatMap((id) => {
        const directors = details.films[id]?.directors;
        return directors ? [directors] : [];
      }),
    );
    const exclude = new Set([
      ...Object.keys(seen),
      ...Object.keys(lists[UserListId.Watchlist]),
    ]);
    return getFavouriteDirectorsRow(
      movies,
      favourites,
      exclude,
      details.people,
    );
  }, [signedIn, lists, details, dataReady, movies]);

  // Settled once there is an answer: a row (or none) worked out, nothing
  // seen, details that couldn't be read, or nobody signed in.
  const settled =
    row !== null ||
    detailsFailed ||
    (signedIn && lists !== null && !hasSeen) ||
    status === "signed-out" ||
    status === "unavailable";

  useLayoutEffect(() => {
    if (!settled || !slotRef.current) return;
    slotRef.current.style.removeProperty("--reserved-height");
    slotRef.current.removeAttribute("data-reserved");
    if (signedIn) {
      storeRowHeight(DIRECTORS_ROW_HEIGHT_KEY, slotRef.current.offsetHeight);
    }
  }, [settled, signedIn, row]);

  return (
    <>
      <div
        id={DIRECTORS_ROW_SLOT_ID}
        ref={slotRef}
        className={styles.watchlistSlot}
        // The reservation script sets a style React doesn't know about.
        suppressHydrationWarning
      >
        {/* Shown by CSS only while the slot is reserved. */}
        {!settled && (
          <LoadingIndicator
            size="sm"
            message="Loading your directors…"
            className={styles.watchlistLoading}
          />
        )}
        {row && row.movies.length > 0 && (
          <PosterRow
            title="From Directors You Love"
            intro="Films showing in the next fortnight by directors you've seen two or more films by."
            movies={row.movies}
            seeAllHref={getPeopleFilterUrl(FilterId.Directors, row.directorIds)}
            seeAllLabel="Explore their films"
            showAll
          />
        )}
      </div>
      <script
        dangerouslySetInnerHTML={{ __html: DIRECTORS_ROW_RESERVATION_SCRIPT }}
      />
    </>
  );
}
