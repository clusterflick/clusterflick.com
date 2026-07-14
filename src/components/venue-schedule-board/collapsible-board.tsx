"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Button from "@/components/button";
import styles from "./venue-schedule-board.module.css";

const DEFAULT_MAX_HEIGHT = 750;

// Measure before paint on the client; fall back to useEffect during SSR to avoid
// React's server useLayoutEffect warning.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface CollapsibleBoardProps {
  children: ReactNode;
  /** Collapse the board when its content is taller than this (px). */
  maxHeight?: number;
}

/**
 * Client wrapper for the schedule board. It stays server-rendered — this reads
 * the pre-rendered HTML rather than re-rendering it, so no performance data is
 * shipped to the client — and adds two behaviours over it:
 *
 * - Clips a tall board (big multi-screen chains) to `maxHeight` with a fade-out
 *   and a "Show all performances" / "Hide performances" toggle. Boards that
 *   already fit render as-is, with no toggle.
 * - Strikes through showings whose start time has already passed, judged against
 *   the *viewer's* clock (the page itself is static), from the `data-time`
 *   stamped on each row.
 */
export default function CollapsibleBoard({
  children,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: CollapsibleBoardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > maxHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxHeight]);

  // Mark already-started showings against the viewer's clock.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const now = Date.now();
    el.querySelectorAll<HTMLElement>("[data-time]").forEach((node) => {
      const time = Number(node.dataset.time);
      if (Number.isFinite(time) && time < now) node.classList.add(styles.past);
    });
  }, []);

  const collapsed = overflows && !expanded;

  const handleToggle = () => {
    setExpanded((value) => {
      const next = !value;
      // When collapsing, the button sits far below the now-shorter board, so the
      // viewport is left stranded at the bottom of the page — pull it back up to
      // the board.
      if (!next) {
        requestAnimationFrame(() =>
          rootRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        );
      }
      return next;
    });
  };

  return (
    <div ref={rootRef} className={styles.collapsibleRoot}>
      <div
        ref={contentRef}
        className={styles.collapsibleContent}
        style={collapsed ? { maxHeight } : undefined}
      >
        {children}
        {collapsed && <div className={styles.fade} aria-hidden="true" />}
      </div>
      {overflows && (
        <div className={styles.toggleRow}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggle}
            aria-expanded={expanded}
          >
            {expanded ? "Hide performances" : "Show all performances"}
          </Button>
        </div>
      )}
    </div>
  );
}
