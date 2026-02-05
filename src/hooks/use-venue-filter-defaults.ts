"use client";

import { useEffect } from "react";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import { getCinemaVenueIds } from "@/utils/get-cinema-venue-ids";

/**
 * Hook to initialize the venue filter to "Cinemas" by default.
 * Should be called on pages that display filtered movie data.
 *
 * This ensures consistent default filtering across all pages:
 * - Only runs once per session (tracked at context level, persists across page navigations)
 * - Only sets defaults if no venue filter is already applied (venues === null)
 * - Uses all venues from metadata, not a subset from a specific movie
 */
export function useVenueFilterDefaults() {
  const { metaData } = useCinemaData();
  const {
    filterState,
    selectVenues,
    venueDefaultApplied,
    setVenueDefaultApplied,
  } = useFilterConfig();

  useEffect(() => {
    // Only apply default once per session (tracked in context, not local ref)
    // This prevents overwriting user's "Select All" action when navigating between pages
    if (
      metaData?.venues &&
      !venueDefaultApplied &&
      filterState.venues === null
    ) {
      const cinemaIds = getCinemaVenueIds(metaData.venues);
      if (cinemaIds.length > 0) {
        selectVenues(cinemaIds);
        setVenueDefaultApplied();
      }
    }
  }, [
    metaData,
    filterState.venues,
    selectVenues,
    venueDefaultApplied,
    setVenueDefaultApplied,
  ]);
}
