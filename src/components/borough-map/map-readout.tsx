"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import styles from "./borough-map.module.css";

interface MapReadoutProps {
  prompt: string;
  /** The map's own viewBox, so the outline lands on the area. */
  viewBox: string;
  /** The map's SVG, whose areas carry `data-shape`, `data-label` and `data-readout`. */
  children: ReactNode;
  /** Beside the map, its rows linked to the areas by the same attributes. */
  aside?: ReactNode;
}

type Active = { label: string; readout: string; shape: string } | null;

function activeFrom(event: SyntheticEvent): Active {
  const area = (event.target as Element).closest?.("[data-shape]");
  if (!area) return null;
  return {
    label: area.getAttribute("data-label") ?? "",
    readout: area.getAttribute("data-readout") ?? "",
    shape: area.getAttribute("data-shape") ?? "",
  };
}

/**
 * Names the area under the pointer or keyboard focus, above the map, and
 * outlines it on top of its neighbours: an SVG draws in source order, so an
 * area's own outline is half hidden under whichever borders it next. Anything
 * in the frame standing for the same area (its row in the aside) is marked
 * `data-active`, so pointing at either picks out both.
 */
export default function MapReadout({
  prompt,
  viewBox,
  children,
  aside,
}: MapReadoutProps) {
  const [active, setActive] = useState<Active>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const update = (event: SyntheticEvent) => setActive(activeFrom(event));
  const shape = active?.shape;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !shape) return;
    const marked = [
      ...frame.querySelectorAll(`[data-shape="${shape}"]`),
    ].filter((element) => element.tagName !== "a");
    for (const element of marked) element.setAttribute("data-active", "");
    return () => {
      for (const element of marked) element.removeAttribute("data-active");
    };
  }, [shape]);

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      onPointerOver={update}
      onPointerLeave={() => setActive(null)}
      onFocus={update}
      onBlur={() => setActive(null)}
    >
      <div className={styles.mapColumn}>
        <div className={styles.readout} aria-hidden="true">
          {active ? (
            <>
              <strong className={styles.readoutLabel}>{active.label}</strong>
              <span className={styles.readoutDetail}>{active.readout}</span>
            </>
          ) : (
            <span className={styles.prompt}>
              <svg
                className={styles.promptIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M5 3l14 7-6 2-2 6z" />
              </svg>
              {prompt}
            </span>
          )}
        </div>
        <div className={styles.canvas}>
          {children}
          {shape && (
            <svg
              className={styles.overlay}
              viewBox={viewBox}
              aria-hidden="true"
            >
              <use href={`#${shape}`} className={styles.outline} />
            </svg>
          )}
        </div>
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </div>
  );
}
