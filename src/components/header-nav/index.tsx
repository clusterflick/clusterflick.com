"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { PRIMARY_NAV_LINKS, setUseBrowserBack } from "@/utils/nav-links";
import styles from "./header-nav.module.css";

// Space reserved on the right of the nav for the always-visible hamburger
// button (40px) plus the gap between it and the last link.
const HAMBURGER_RESERVE = 52;
// Breathing room kept between the nav's left neighbour and the nav itself.
const NEIGHBOUR_MARGIN = 24;

/**
 * Inline primary nav links. All links are rendered, but only the ones that fit
 * to the left of the nav's nearest neighbour are shown — the rest remain
 * reachable via the always-visible hamburger menu. On filter pages that
 * neighbour is the centred filter summary (which grows as its text does); on
 * the home page there's no filter, so the wordmark logo is the neighbour.
 */
export default function HeaderNav() {
  const navRef = useRef<HTMLElement>(null);
  // Natural widths (incl. gap) of each link, cached from live measurements so
  // hidden links don't report 0. Text is static, so these are stable.
  const linkWidths = useRef<number[]>([]);
  const [visibleCount, setVisibleCount] = useState(PRIMARY_NAV_LINKS.length);

  const recompute = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    // If nav is hidden, nothing to measure (e.g. breakpoint)
    if (nav.offsetParent === null) return;

    const children = Array.from(nav.children) as HTMLElement[];
    const gap = parseFloat(getComputedStyle(nav).columnGap || "0") || 0;
    children.forEach((child, i) => {
      // Only currently-visible links report a real width; cache those.
      if (!child.hidden && child.offsetWidth > 0) {
        linkWidths.current[i] = child.offsetWidth + gap;
      }
    });

    // The nav's left boundary is whichever neighbour reaches furthest right:
    // the centred filter summary (filter pages) or the wordmark logo (home).
    const filter = document.querySelector<HTMLElement>("[data-filter-summary]");
    const logo = document.querySelector<HTMLElement>("[data-header-logo]");
    const boundaryRight = Math.max(
      filter?.getBoundingClientRect().right ?? 0,
      logo?.getBoundingClientRect().right ?? 0,
    );
    const available =
      window.innerWidth -
      20 - // .navGroup right offset
      HAMBURGER_RESERVE -
      Math.max(0, boundaryRight + NEIGHBOUR_MARGIN);

    let used = 0;
    let count = 0;
    for (let i = 0; i < PRIMARY_NAV_LINKS.length; i++) {
      used += linkWidths.current[i] ?? 0;
      if (used > available) break;
      count++;
    }

    setVisibleCount(count);
  }, []);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: measure the DOM on mount, then set how many links fit
    recompute();

    const onResize = () => recompute();
    window.addEventListener("resize", onResize);

    // Re-measure whenever a neighbour resizes: the filter summary as its text
    // changes, or the logo as the wordmark shows/hides across breakpoints.
    const observer = new ResizeObserver(() => recompute());
    const filter = document.querySelector<HTMLElement>("[data-filter-summary]");
    const logo = document.querySelector<HTMLElement>("[data-header-logo]");
    if (filter) observer.observe(filter);
    if (logo) observer.observe(logo);
    if (navRef.current) observer.observe(navRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, [recompute]);

  return (
    <nav ref={navRef} className={styles.nav} aria-label="Main navigation">
      {PRIMARY_NAV_LINKS.map(({ href, label }, i) => (
        <Link
          key={href}
          href={href}
          onClick={setUseBrowserBack}
          hidden={i >= visibleCount}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
