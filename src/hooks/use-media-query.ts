"use client";

import { useCallback, useContext, useSyncExternalStore } from "react";
import { ViewWindowContext } from "@/state/view-window-context";

/**
 * Whether a CSS media query currently matches, updating as it changes. False
 * during server rendering, so only use it for what renders after hydration or
 * can tolerate settling on the client.
 *
 * Asked of the window the component is drawn in (`ViewWindowProvider`), so
 * inside the profile preview's iframe it answers for the preview's width.
 */
export function useMediaQuery(query: string): boolean {
  const view = useContext(ViewWindowContext);
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = (view ?? window).matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query, view],
  );
  return useSyncExternalStore(
    subscribe,
    () => (view ?? window).matchMedia(query).matches,
    () => false,
  );
}
