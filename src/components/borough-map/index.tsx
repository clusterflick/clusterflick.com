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
  /** What the readout says while the area is pointed at or focused. */
  readout: string;
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
  nothingOnLabel?: string;
  noVenuesLabel?: string;
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
 * the client. A touch reader's tap follows the link instead, so the figures
 * belong in a table beside it too (see `RankedBarChart`).
 *
 * The bands are one hue, getting lighter as the quantity grows, validated as a
 * ramp against the page's navy: every step reads apart from its neighbours and
 * the lowest still clears the background. The two non-quantities are grey
 * rather than a step of the ramp, so a borough with nothing on can't be read
 * as one with a little on.
 */
export default function BoroughMap({
  viewBox,
  items,
  bands,
  caption,
  prompt,
  nothingOnLabel = "Nothing on",
  noVenuesLabel = "No venues listed",
}: BoroughMapProps) {
  if (bands.length > RAMP_SIZE) {
    throw new Error(`BoroughMap has ${RAMP_SIZE} bands, given ${bands.length}`);
  }
  // The ramp is spread over however many bands are used, so three bands
  // still run from the dimmest step to the brightest.
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
      <MapReadout prompt={prompt} viewBox={viewBox}>
        <svg
          viewBox={viewBox}
          className={styles.map}
          role="group"
          aria-label={caption}
        >
          {items.map((item) => {
            const className = clsx(styles.area, bandClass(resolve(item.band)));
            const id = `borough-map-${item.key}`;
            return item.href ? (
              <Link
                key={item.key}
                href={item.href}
                aria-label={item.readout}
                data-readout={item.readout}
                data-shape={id}
              >
                <path id={id} d={item.path} className={className} />
              </Link>
            ) : (
              <g
                key={item.key}
                data-readout={item.readout}
                data-shape={id}
                aria-label={item.readout}
                role="img"
              >
                <path id={id} d={item.path} className={className} />
              </g>
            );
          })}
        </svg>
      </MapReadout>
    </figure>
  );
}
