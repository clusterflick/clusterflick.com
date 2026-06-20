"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useCinemaData } from "@/state/cinema-data-context";
import { computeDiscoveryRows } from "@/utils/get-discovery-movies";
import DiscoveryRowsView from "./discovery-rows-view";

interface DiscoverySectionsProps {
  /** Server-rendered rows from build-time data, shown until client data loads. */
  fallback: ReactNode;
}

/**
 * Renders the SSR `fallback` rows (a build-time snapshot) until the full cinema
 * data has loaded client-side, then transparently swaps to rows recomputed
 * against that data. The client data is pruned to the current view day, so
 * showings that have lapsed since the build drop out and the rows stay in step
 * with the movie pages.
 */
export default function DiscoverySections({
  fallback,
}: DiscoverySectionsProps) {
  const { movies, isLoading, hasAttemptedLoad, getData } = useCinemaData();

  // Fetch the full dataset once on mount. Empty deps are intentional — getData
  // returns early if the data is already loaded (shared app-wide context).
  useEffect(() => {
    getData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ready =
    hasAttemptedLoad && !isLoading && Object.keys(movies).length > 0;

  // Anchor the window to "now" (not midnight) so showings that have already
  // finished today drop out — matching how the movie pages hide them.
  const rows = useMemo(
    () => (ready ? computeDiscoveryRows(movies, { anchorToNow: true }) : null),
    [ready, movies],
  );

  return rows ? <DiscoveryRowsView rows={rows} /> : <>{fallback}</>;
}
