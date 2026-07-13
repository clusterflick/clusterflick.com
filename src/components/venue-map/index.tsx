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
}

export default function VenueMap({ venues, boundary }: VenueMapProps) {
  return <LeafletVenueMap venues={venues} boundary={boundary} />;
}
