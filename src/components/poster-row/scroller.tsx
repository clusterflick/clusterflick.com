"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
}: PosterScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);

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
      // Sensible pre-hydration default: a fresh row starts scrolled to the left,
      // so hint that there's more to the right until the effect measures.
      data-scroll-right="true"
    >
      {children}
    </div>
  );
}
