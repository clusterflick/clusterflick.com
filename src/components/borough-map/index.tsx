import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import MapReadout from "./map-readout";
import styles from "./borough-map.module.css";

/**
 * Where an area sits on the scale: a band index (0 is the lowest), or one of
 * the two states that aren't a quantity at all.
 */
export type BoroughMapBand = number | "nothing-on" | "no-venues";

export interface BoroughMapItem {
  key: string;
  label: string;
  /** SVG path data in the map's viewBox. */
  path: string;
  /** The area's own page; an area with none is drawn but not linked. */
  href?: string;
  band: BoroughMapBand;
  /**
   * The area the map is about, outlined in yellow, as `RankedBarChart`
   * draws its highlighted row in the accent colour.
   */
  highlight?: boolean;
  /**
   * What the readout says beside the area's label while it is pointed at or
   * focused: "4 films across 4 screenings, at 3 of its 16 venues".
   */
  readout: string;
}

/**
 * Attributes that let anything inside the map's frame (a row of the `aside`)
 * stand for an area: pointing at it fills the readout and outlines the area,
 * and pointing at the area marks it with `data-active`.
 */
export function getBoroughMapLinkAttributes(
  key: string,
  label: string,
  readout: string,
): Record<`data-${string}`, string> {
  return {
    "data-shape": `borough-map-${key}`,
    "data-label": label,
    "data-readout": readout,
  };
}

interface BoroughMapProps {
  viewBox: string;
  items: BoroughMapItem[];
  /** Labels for the bands, lowest first. At most five. */
  bands: string[];
  /** Names the map for assistive technology and the legend. */
  caption: string;
  /** What the readout says while nothing is pointed at. */
  prompt: string;
  /** The same on a touch screen, where an area is tapped rather than pointed at. */
  touchPrompt?: string;
  nothingOnLabel?: string;
  noVenuesLabel?: string;
  /**
   * Drawn beside the map on a wide screen and below it on a narrow one, inside
   * the same frame, so rows carrying `getBoroughMapLinkAttributes` are linked
   * to their areas both ways.
   */
  aside?: ReactNode;
}

const RAMP_SIZE = 5;

function bandClass(band: BoroughMapBand) {
  if (band === "nothing-on") return styles.nothingOn;
  if (band === "no-venues") return styles.noVenues;
  return styles[`band${band}`];
}

/**
 * London's boroughs shaded by one quantity, each linking to its own page. The
 * SVG is rendered on the server, so the map and its links are in the static
 * HTML; the readout naming what's pointed at is the only part that runs on
 * the client. On a touch screen the first tap on an area selects it and a
 * second opens it. The figures belong in a table beside it too (see
 * `RankedBarChart`): it is the exact order, and the readout a phone reader
 * can scan without tapping every borough.
 *
 * The bands are one hue, getting darker as the quantity grows, validated as a
 * ramp against the page's navy: every step reads apart from its neighbours and
 * the darkest still clears the background. The two non-quantities are grey
 * rather than a step of the ramp, so a borough with nothing on can't be read
 * as one with a little on.
 */
export default function BoroughMap({
  viewBox,
  items,
  bands,
  caption,
  prompt,
  touchPrompt,
  nothingOnLabel = "Nothing on",
  noVenuesLabel = "No venues listed",
  aside,
}: BoroughMapProps) {
  if (bands.length > RAMP_SIZE) {
    throw new Error(`BoroughMap has ${RAMP_SIZE} bands, given ${bands.length}`);
  }
  // The ramp is spread over however many bands are used, so three bands
  // still run from the lightest step to the darkest.
  const step = (band: number) =>
    bands.length === 1
      ? RAMP_SIZE - 1
      : Math.round((band * (RAMP_SIZE - 1)) / (bands.length - 1));
  const resolve = (band: BoroughMapBand): BoroughMapBand =>
    typeof band === "number" ? step(band) : band;

  const legend: { key: string; label: string; band: BoroughMapBand }[] = [
    ...bands.map((label, index) => ({
      key: `band-${index}`,
      label,
      band: step(index),
    })),
  ];
  if (items.some((item) => item.band === "nothing-on")) {
    legend.unshift({
      key: "nothing-on",
      label: nothingOnLabel,
      band: "nothing-on",
    });
  }
  if (items.some((item) => item.band === "no-venues")) {
    legend.unshift({
      key: "no-venues",
      label: noVenuesLabel,
      band: "no-venues",
    });
  }

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>{caption}</figcaption>
      <ul className={styles.legend} aria-label="Key">
        {legend.map((entry) => (
          <li key={entry.key}>
            <span className={clsx(styles.swatch, bandClass(entry.band))} />
            {entry.label}
          </li>
        ))}
      </ul>
      <MapReadout
        prompt={prompt}
        touchPrompt={touchPrompt}
        viewBox={viewBox}
        aside={aside}
      >
        <svg
          viewBox={viewBox}
          className={styles.map}
          role="group"
          aria-label={caption}
        >
          {/* Highlighted areas last, so no neighbour is drawn over their
              outline. */}
          {[
            ...items.filter((item) => !item.highlight),
            ...items.filter((item) => item.highlight),
          ].map((item) => {
            const className = clsx(
              styles.area,
              bandClass(resolve(item.band)),
              item.highlight && styles.highlight,
            );
            const link = getBoroughMapLinkAttributes(
              item.key,
              item.label,
              item.readout,
            );
            const id = link["data-shape"];
            const label = `${item.label}: ${item.readout}`;
            return item.href ? (
              <Link
                key={item.key}
                href={item.href}
                aria-label={label}
                {...link}
              >
                <path id={id} d={item.path} className={className} />
              </Link>
            ) : (
              <g key={item.key} aria-label={label} role="img" {...link}>
                <path id={id} d={item.path} className={className} />
              </g>
            );
          })}
        </svg>
      </MapReadout>
    </figure>
  );
}
