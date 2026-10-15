"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./scroller.module.css";

interface PosterScrollerProps {
  children: ReactNode;
  /**
   * Below 1200px, break out to the full viewport width so items clip at the
   * screen edge rather than at the content gutter. Defaults to true. Turn it off
   * when the scroller sits inside a visible container (the planner's lanes),
   * which the breakout would overrun.
   */
  bleed?: boolean;
  /**
   * Names the row among the page's scrollers, so its horizontal position can be
   * put back after a trip to a listing page and back. Unique per page; the
   * row's title is the usual choice. Without one the row always starts at the
   * left.
   */
  scrollKey?: string;
}

/**
 * A row remounts at the left whenever the page is rendered again, which on a
 * client-side back navigation is every time. Like the planner's vertical
 * snapshot, positions are taken on the way out (a click on any link inside a
 * row) and handed back once on return.
 */
const SCROLL_STORAGE_KEY = "clusterflick-poster-scroll";

interface SavedScroll {
  path: string;
  positions: Record<string, number>;
}

function readSavedScroll(): SavedScroll | null {
  try {
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedScroll) : null;
  } catch {
    return null;
  }
}

/** Every keyed row on the page, not just the one clicked: several may have moved. */
function saveScrollPositions() {
  const positions: Record<string, number> = {};
  document.querySelectorAll<HTMLElement>("[data-scroll-key]").forEach((el) => {
    if (el.scrollLeft > 0) positions[el.dataset.scrollKey!] = el.scrollLeft;
  });
  try {
    sessionStorage.setItem(
      SCROLL_STORAGE_KEY,
      JSON.stringify({
        path: window.location.pathname,
        positions,
      } satisfies SavedScroll),
    );
  } catch {
    // Ignore - UX optimisation only
  }
}

/** Read once and cleared per row, so only the return trip restores it. */
function takeSavedPosition(key: string): number | null {
  const saved = readSavedScroll();
  if (!saved) return null;
  try {
    if (saved.path !== window.location.pathname) {
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      return null;
    }
    const position = saved.positions[key];
    if (position === undefined) return null;
    delete saved.positions[key];
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(saved));
    return position;
  } catch {
    return null;
  }
}

/**
 * Horizontal scroller that reports its overflow state so the CSS can fade
 * whichever edge has off-screen content. Purely presentational — the items
 * (posters, or the planner's performance cards) are passed in as children.
 *
 * Spacing a caller needs to own is set as custom properties on a parent, since
 * a class on the scroller itself would race this module's rules on stylesheet
 * order: `--poster-scroller-gap` (default 16px) and
 * `--poster-scroller-padding-top` (default 0; room for a card's hover lift,
 * which the overflow would otherwise clip).
 */
export default function PosterScroller({
  children,
  bleed = true,
  scrollKey,
}: PosterScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Before paint, so the row doesn't flash at the left first. Runs ahead of the
  // effect below, which then measures the restored position for the fades.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !scrollKey) return;
    const position = takeSavedPosition(scrollKey);
    if (position !== null) el.scrollLeft = position;
  }, [scrollKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      // 1px tolerance to avoid subpixel-rounding flicker at the extremes.
      el.dataset.scrollLeft = String(el.scrollLeft > 1);
      el.dataset.scrollRight = String(
        el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      );
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(styles.posterScroller, bleed && styles.bleed)}
      data-scroll-key={scrollKey}
      onClickCapture={(event) => {
        if (scrollKey && (event.target as HTMLElement).closest("a")) {
          saveScrollPositions();
        }
      }}
      // Sensible pre-hydration default: a fresh row starts scrolled to the left,
      // so hint that there's more to the right until the effect measures.
      data-scroll-right="true"
    >
      {children}
    </div>
  );
}
