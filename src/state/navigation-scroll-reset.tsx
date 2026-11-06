"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * How long after a navigation a scroll the reader didn't make is undone.
 * Long enough to cover the address bar's show and hide animation, short
 * enough that nothing a page does on purpose later is caught by it.
 */
const SETTLE_MS = 1000;

/** Anything that means the reader has started moving the page themselves. */
const READER_INPUT = ["touchstart", "pointerdown", "wheel", "keydown"] as const;

/**
 * Keeps a new page at the top once Next.js has put it there.
 *
 * Next scrolls to the top on a link's navigation, and on desktop and in
 * headless Chromium that is where the page stays. On Chrome for Android it
 * didn't: following a footer link from the bottom of a page, with the
 * address bar hidden, landed ~50px down, with the top of the hero under the
 * header. A swipe down then showed the rest, so the page really was scrolled
 * and not just covered. The shift happens after Next's scroll and nothing
 * here causes it, so it is put back: for a moment after a navigation, any
 * scroll away from the top the reader didn't make is undone.
 *
 * Only for a forward navigation to a new path. Back and Forward are the
 * browser's to restore, an address with a hash is scrolled to its anchor,
 * and a change of search params alone (the films grid writing its filters)
 * isn't a new page. It stops at the reader's first touch, pointer, wheel or
 * key, so it can never fight them. A page that scrolls itself on arrival
 * without a hash would be undone by this too; none does.
 *
 * Renders nothing.
 */
export function NavigationScrollReset() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  // When the last popstate was. A time rather than a flag, since a popstate
  // that changes only the hash never changes the path, and a flag it left set
  // would swallow the next real navigation.
  const lastPopState = useRef(-Infinity);

  useEffect(() => {
    const onPopState = () => {
      lastPopState.current = performance.now();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (performance.now() - lastPopState.current < SETTLE_MS) return;
    if (window.location.hash) return;

    const toTop = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(toTop);
    });
    const stop = () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener("scroll", toTop);
      for (const type of READER_INPUT) {
        window.removeEventListener(type, stop, true);
      }
    };
    const timeout = window.setTimeout(stop, SETTLE_MS);
    window.addEventListener("scroll", toTop, { passive: true });
    for (const type of READER_INPUT) {
      window.addEventListener(type, stop, { capture: true, passive: true });
    }
    return stop;
  }, [pathname]);

  return null;
}
