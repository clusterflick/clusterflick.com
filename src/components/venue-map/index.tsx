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
   * Edge to edge: no frame, taller, and faded into the page at the top and
   * bottom. The parent must already span the window — the map doesn't break
   * out of a column itself.
   */
  bleed?: boolean;
}

export default function VenueMap({
  venues,
  boundary,
  distanceRingsMiles,
  fill,
  bleed,
}: VenueMapProps) {
  const map = (
    <LeafletVenueMap
      venues={venues}
      boundary={boundary}
      distanceRingsMiles={distanceRingsMiles}
      fill={fill}
      bleed={bleed}
      // A map in the page shares its scroll with the page, so one finger and
      // a plain wheel scroll the page. Full screen there's no page to scroll.
      cooperativeGestures={!fill}
    />
  );

  // The frame sizes the skeleton too, which `dynamic`'s loading fallback can't
  // be handed props for — without it the page would jump when the map loads.
  return bleed ? <div className={styles.bleed}>{map}</div> : map;
}
