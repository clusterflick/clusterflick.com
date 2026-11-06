"use client";

import { useState, type ReactNode, type SyntheticEvent } from "react";
import styles from "./borough-map.module.css";

interface MapReadoutProps {
  prompt: string;
  /** The map's own viewBox, so the outline lands on the area. */
  viewBox: string;
  /** The map's SVG, whose areas carry `data-readout` and `data-shape`. */
  children: ReactNode;
}

type Active = { readout: string; shape: string } | null;

function activeFrom(event: SyntheticEvent): Active {
  const area = (event.target as Element).closest?.("[data-readout]");
  if (!area) return null;
  return {
    readout: area.getAttribute("data-readout") ?? "",
    shape: area.getAttribute("data-shape") ?? "",
  };
}

/**
 * Names the area under the pointer or keyboard focus, above the map, and
 * outlines it on top of its neighbours: an SVG draws in source order, so an
 * area's own outline is half hidden under whichever borders it next.
 */
export default function MapReadout({
  prompt,
  viewBox,
  children,
}: MapReadoutProps) {
  const [active, setActive] = useState<Active>(null);
  const update = (event: SyntheticEvent) => setActive(activeFrom(event));

  return (
    <div
      className={styles.frame}
      onPointerOver={update}
      onPointerLeave={() => setActive(null)}
      onFocus={update}
      onBlur={() => setActive(null)}
    >
      <p className={styles.readout} aria-hidden="true">
        {active?.readout ?? prompt}
      </p>
      <div className={styles.canvas}>
        {children}
        {active?.shape && (
          <svg className={styles.overlay} viewBox={viewBox} aria-hidden="true">
            <use href={`#${active.shape}`} className={styles.outline} />
          </svg>
        )}
      </div>
    </div>
  );
}
