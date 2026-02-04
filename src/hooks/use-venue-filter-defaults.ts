"use client";

import { useEffect, useRef } from "react";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import { getCinemaVenueIds } from "@/utils/get-cinema-venue-ids";

/**
 * Hook to initialize the venue filter to "Cinemas" by default.
 * Should be called on pages that display filtered movie data.
 *
 * This ensures consistent default filtering across all pages:
 * - Only runs once per component mount
 * - Only sets defaults if no venue filter is already applied (venues === null)
 * - Uses all venues from metadata, not a subset from a specific movie
 */
export function useVenueFilterDefaults() {
  const { metaData } = useCinemaData();
  const { filterState, selectVenues } = useFilterConfig();
  const initialized = useRef(false);

  useEffect(() => {
    if (
      metaData?.venues &&
      !initialized.current &&
      filterState.venues === null
    ) {
      const cinemaIds = getCinemaVenueIds(metaData.venues);
      if (cinemaIds.length > 0) {
        selectVenues(cinemaIds);
        initialized.current = true;
      }
    }
  }, [metaData, filterState.venues, selectVenues]);
}
