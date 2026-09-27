"use client";

import { useEffect } from "react";

/**
 * Links to a films grid with the filter overlay open, as
 * `/catalogue#open-filters`. For a pointer to a control that lives in the
 * overlay, such as the My Venues pill, where describing it isn't enough.
 */
export const OPEN_FILTERS_HASH = "open-filters";

/**
 * Opens the filter overlay when the page is reached through
 * `#open-filters`, then drops the hash so a refresh or a Back doesn't open it
 * again.
 *
 * Call it before any effect that rewrites the URL (`applyUrlParams`), since
 * effects run in order and those replace the whole address, hash and all. The
 * hash is read in an effect rather than during render: on a client-side
 * navigation the router updates the address only once the new page commits.
 */
export function useOpenFiltersHash(open: () => void) {
  useEffect(() => {
    if (window.location.hash !== `#${OPEN_FILTERS_HASH}`) return;
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    );
    open();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
