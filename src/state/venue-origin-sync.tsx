"use client";

import { useEffect } from "react";
import { getPlaceVenues, reresolveAutoVenueOrigin } from "@/lib/places";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";

/**
 * Picks an Auto venue selection again once the listings are complete, so a
 * pick made while they were still arriving doesn't stay on the venues that
 * happened to have loaded. "Near me today", tapped as the catalogue opened,
 * picked 10 venues around Soho rather than 28.
 *
 * Only while the selection is still the one Auto made (`venueOrigin` is null
 * once the reader changes it), and only over a complete dataset: while chunks
 * are loading, or any failed, the venues with something showing are not yet
 * known. A retry that recovers them settles it then.
 *
 * Renders nothing. It sits in the layout rather than in `FilterConfigProvider`,
 * which stories mount without the listings.
 */
export function VenueOriginSync() {
  const { movies, metaData, isLoading, hasAttemptedLoad, failedFiles } =
    useCinemaData();
  const { venueOrigin, selectVenuesNear } = useFilterConfig();

  const complete =
    hasAttemptedLoad && !isLoading && failedFiles.length === 0 && !!metaData;

  useEffect(() => {
    if (!complete || !venueOrigin) return;
    const reresolved = reresolveAutoVenueOrigin(
      venueOrigin,
      getPlaceVenues(metaData?.venues, movies),
    );
    if (reresolved) selectVenuesNear(reresolved);
  }, [complete, venueOrigin, metaData, movies, selectVenuesNear]);

  return null;
}
