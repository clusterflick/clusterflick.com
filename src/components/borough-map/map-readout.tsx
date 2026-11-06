"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import styles from "./borough-map.module.css";

interface MapReadoutProps {
  prompt: string;
  /** The prompt on a touch screen, where nothing can be pointed at. */
  touchPrompt?: string;
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
 *
 * A touch screen has no pointing, so a tap on an area selects it rather than
 * following its link, and a second tap on the same area follows it. Without
 * that a tap went straight to the borough's page, and the map's figures could
 * only be read from the list. Only taps on the map are held back: a row of
 * the aside is a plain link, and its figures are already written in it. A
 * mouse click and a keyboard Enter follow the link at once, as before.
 */
export default function MapReadout({
  prompt,
  touchPrompt = prompt,
  viewBox,
  children,
  aside,
}: MapReadoutProps) {
  const [active, setActive] = useState<Active>(null);
  // The area a tap has selected, which the next tap on it opens
  const [tapped, setTapped] = useState<string | null>(null);
  // How the latest press began: a click carries no reliable pointer type of
  // its own across browsers, and a keyboard press has no pointerdown at all
  const pressRef = useRef<string>("mouse");
  const frameRef = useRef<HTMLDivElement>(null);
  const update = (event: SyntheticEvent) => setActive(activeFrom(event));
  const shape = active?.shape;

  const handleClick = (event: MouseEvent) => {
    if (pressRef.current !== "touch") return;
    const target = event.target as Element;
    // Only the map's areas: the aside's rows are links like any other
    if (!target.closest?.("svg")) return;
    const area = activeFrom(event);
    if (!area) {
      setTapped(null);
      setActive(null);
      return;
    }
    if (tapped === area.shape) return;
    event.preventDefault();
    setTapped(area.shape);
    setActive(area);
  };

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
      onPointerDown={(event) => {
        pressRef.current = event.pointerType;
      }}
      onKeyDown={() => {
        pressRef.current = "keyboard";
      }}
      onPointerOver={(event) => {
        // A touch's pointerover lands before its click, which decides
        if (event.pointerType !== "touch") update(event);
      }}
      onPointerLeave={(event) => {
        // A touch "leaves" as soon as the finger lifts, which would clear
        // the area the tap has just selected
        if (event.pointerType === "touch") return;
        setActive(null);
        setTapped(null);
      }}
      onClickCapture={handleClick}
      onFocus={(event) => {
        if (pressRef.current !== "touch") update(event);
      }}
      onBlur={(event) => {
        if (frameRef.current?.contains(event.relatedTarget as Node)) return;
        setActive(null);
        setTapped(null);
      }}
    >
      <div className={styles.mapColumn}>
        <div className={styles.readout} aria-hidden="true">
          {active ? (
            <>
              <span className={styles.readoutHeading}>
                <strong className={styles.readoutLabel}>{active.label}</strong>
                {tapped === active.shape && (
                  <span className={styles.readoutHint}>Tap again to open</span>
                )}
              </span>
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
              <span className={styles.promptPointer}>{prompt}</span>
              <span className={styles.promptTouch}>{touchPrompt}</span>
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
