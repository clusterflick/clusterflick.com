"use client";

import { useEffect, useRef } from "react";
import { filterManager, type FilterState } from "@/lib/filters";
import {
  resolveUrlFilterState,
  useFilterConfig,
} from "@/state/filter-config-context";

/**
 * The href the last Back or Forward landed on, until a page reads it. A bare
 * address means two different things depending on how it was reached, and
 * only this tells them apart (see useFilterUrlSync).
 *
 * Registered at import rather than in an effect, because the popstate that
 * leads to a page fires before that page mounts.
 */
let traversedHref: string | null = null;
let documentEntryRead = false;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    traversedHref = window.location.href;
  });
}

/** Whether the current address was reached by Back or Forward. Read once. */
function takeArrivedByTraversal(): boolean {
  const href = window.location.href;
  const traversed = traversedHref === href;
  traversedHref = null;
  if (traversed) return true;
  // A Back from another site reloads the document rather than firing
  // popstate, which only the document's own navigation entry records — and
  // only for the first page it renders.
  if (documentEntryRead) return false;
  documentEntryRead = true;
  const [entry] = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  return entry?.type === "back_forward";
}

/** Rewrite the address's filter params to `state`, adding no history entry. */
function writeFilterParams(state: FilterState) {
  const { pathname, search, hash } = window.location;
  const query = filterManager.replaceFilterParams(search, state);
  const next = `${pathname}${query ? `?${query}` : ""}${hash}`;
  if (next === `${pathname}${search}${hash}`) return;
  window.history.replaceState(window.history.state, "", next);
}

/**
 * Keeps the filters in the address, for the films grids (the catalogue and
 * planner), so each history entry holds the filters it was showing and Back
 * returns to them.
 *
 * The address is the filters when it carries any. A bare one means one of two
 * things:
 *
 * - **Reached by a link** (the nav's Films, "Back to film list"): carry on
 *   with the tab's filters from session storage, as before. So no link on the
 *   site has to carry the filters to keep them.
 * - **Reached by Back or Forward**: the defaults. Every entry this page shows
 *   is written with its filters, and only the defaults write nothing.
 *
 * Every change is written back with `replaceState`, so tapping through chips
 * doesn't fill the history and Back still leaves the page. Session storage is
 * kept in step by the provider as before, which is what lets the film page and
 * a bare link pick up the last filters used.
 *
 * Call it after `useOpenFiltersHash`, which reads the hash this keeps.
 */
export function useFilterUrlSync() {
  const { filterState, applyFilterState } = useFilterConfig();
  const latestState = useRef(filterState);
  const adopted = useRef(false);

  // Resolve the address the page was reached on, over the state it found.
  const readAddress = (current: FilterState, traversed: boolean) => {
    const fromUrl = resolveUrlFilterState(window.location.search, current);
    if (fromUrl) return fromUrl;
    return traversed
      ? filterManager.keepPersonalFilters(
          filterManager.getDefaultState(),
          current,
        )
      : current;
  };

  useEffect(() => {
    latestState.current = filterState;
    let state = filterState;
    if (!adopted.current) {
      adopted.current = true;
      const fromAddress = readAddress(filterState, takeArrivedByTraversal());
      if (!filterManager.statesEqual(fromAddress, filterState)) {
        applyFilterState(fromAddress);
        state = fromAddress;
      }
    }
    writeFilterParams(state);
  }, [filterState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Back and Forward between two entries of this same page don't remount it.
  useEffect(() => {
    const path = window.location.pathname;
    const onPopState = () => {
      // Leaving for another page: that page reads its own address.
      if (window.location.pathname !== path) return;
      traversedHref = null;
      const fromAddress = readAddress(latestState.current, true);
      if (!filterManager.statesEqual(fromAddress, latestState.current)) {
        applyFilterState(fromAddress);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
