"use client";

import dynamic from "next/dynamic";
import type { VenueMapVenue } from "./leaflet-venue-map";
import styles from "./venue-map.module.css";

// Leaflet touches `window` at import time, so the real map is loaded only on the
// client. `ssr: false` also keeps it out of the static-export prerender.
const LeafletVenueMap = dynamic(() => import("./leaflet-venue-map"), {
  ssr: false,
  loading: () => (
    <div className={styles.skeleton} aria-hidden="true">
      <span className={styles.skeletonLabel}>Loading map…</span>
    </div>
  ),
});

export type { VenueMapVenue };

interface VenueMapProps {
  venues: VenueMapVenue[];
  boundary?: GeoJSON.GeoJsonObject;
  distanceRingsMiles?: number[];
  /** Fill the parent's height, e.g. inside a full-screen dialog. */
  fill?: boolean;
  /**
   * Leave one-finger drags and plain wheel scrolls to the page. On by default
   * for a map in the page; off for `fill`, unless the filled parent is itself
   * part of a scrolling page.
   */
  cooperativeGestures?: boolean;
  /**
   * Pixels at the top covered by something laid over the map, such as a
   * heading. Framing, popups and the controls keep below it.
   */
  insetTop?: number;
}

export default function VenueMap({
  venues,
  boundary,
  distanceRingsMiles,
  fill,
  cooperativeGestures = !fill,
  insetTop,
}: VenueMapProps) {
  return (
    <LeafletVenueMap
      venues={venues}
      boundary={boundary}
      distanceRingsMiles={distanceRingsMiles}
      fill={fill}
      // A map in the page shares its scroll with the page, so one finger and
      // a plain wheel scroll the page. Full screen there's no page to scroll.
      cooperativeGestures={cooperativeGestures}
      insetTop={insetTop}
    />
  );
}
