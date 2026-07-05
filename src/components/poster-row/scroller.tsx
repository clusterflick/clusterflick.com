"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./scroller.module.css";

/**
 * Horizontal poster scroller that reports its overflow state so the CSS can fade
 * whichever edge has off-screen content. Purely presentational — the posters are
 * passed in as server-rendered children.
 */
export default function PosterScroller({ children }: { children: ReactNode }) {
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
      className={styles.posterScroller}
      // Sensible pre-hydration default: a fresh row starts scrolled to the left,
      // so hint that there's more to the right until the effect measures.
      data-scroll-right="true"
    >
      {children}
    </div>
  );
}
