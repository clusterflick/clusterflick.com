"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  Circle,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import Link from "next/link";
import L from "leaflet";
import { useGeolocationContext } from "@/state/geolocation-context";
import Button from "@/components/button";
import { MapPinIcon } from "@/components/icons";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import styles from "./venue-map.module.css";

export interface VenueMapVenue {
  id: string;
  name: string;
  href: string;
  type: string;
  lat: number;
  lon: number;
  filmCount: number;
}

// Centre of London — fallback view before venue bounds are fitted.
const LONDON_CENTRE: [number, number] = [51.5074, -0.1278];
const DEFAULT_ZOOM = 11;

// After the filter narrows the markers, wait for typing to settle before
// animating the map to frame what's left.
const REFIT_DEBOUNCE_MS = 450;
// Stop a single-venue match from slamming all the way to street level.
const REFIT_MAX_ZOOM = 14;
const FIT_PADDING: [number, number] = [32, 32];

// Faint Greater London outline. Non-interactive so it never intercepts clicks.
const BOUNDARY_STYLE = {
  color: "#319edb", // --color-electric-blue
  weight: 1.5,
  opacity: 0.4,
  fillColor: "#319edb",
  fillOpacity: 0.05,
  interactive: false,
};

// Distance rings drawn around the user (near-me page). Dashed electric-blue so
// they read as "range from you" and contrast with the pink venue pins.
const MILES_TO_METRES = 1609.344;
// 1 degree of latitude ≈ 69 miles — used to place ring labels at the north edge.
const MILES_PER_DEGREE_LAT = 69;
const RING_STYLE = {
  color: "#319edb", // --color-electric-blue
  weight: 1.5,
  opacity: 0.5,
  dashArray: "5 6",
  fill: false,
  interactive: false,
};

function ringLabelIcon(label: string) {
  return L.divIcon({
    className: styles.ringLabelMarker,
    html: `<span class="${styles.ringLabel}">${label}</span>`,
    iconSize: [64, 18],
    iconAnchor: [32, 9],
  });
}

// Icons are created once at module scope. This file is only ever imported on
// the client (via a dynamic `ssr: false` wrapper), so `L` is safe to touch here.
const venueIcon = L.divIcon({
  className: styles.venueMarker,
  html: `<span class="${styles.venuePin}"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

const userIcon = L.divIcon({
  className: styles.userMarker,
  html: `<span class="${styles.userDot}"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/** Themed cluster bubbles, sized in tiers by how many venues they contain. */
function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const tier = count < 10 ? "small" : count < 50 ? "medium" : "large";
  return L.divIcon({
    html: `<div class="${styles.cluster} ${styles[tier]}"><span>${count}</span></div>`,
    className: styles.clusterMarker,
    iconSize: L.point(40, 40, true),
  });
}

/** Bridges the Leaflet map instance up to the parent so controls can drive it. */
function MapRefBridge({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMap(map);
  }, [map, onMap]);
  return null;
}

interface LeafletVenueMapProps {
  venues: VenueMapVenue[];
  boundary?: GeoJSON.GeoJsonObject;
  /**
   * Radii (in miles) to draw as distance rings around the user's position, e.g.
   * `[1, 2]`. When set (and a position is known) the map frames the largest ring
   * instead of the venue bounds. Used by the near-me page.
   */
  distanceRingsMiles?: number[];
}

export default function LeafletVenueMap({
  venues,
  boundary,
  distanceRingsMiles,
}: LeafletVenueMapProps) {
  const { position, loading, error, requestLocation } = useGeolocationContext();
  const [map, setMap] = useState<L.Map | null>(null);
  const didFit = useRef(false);

  const showRings = !!distanceRingsMiles?.length && !!position;

  const venuesBounds = useMemo(
    () =>
      venues.length > 0
        ? L.latLngBounds(venues.map((v) => [v.lat, v.lon] as [number, number]))
        : null,
    [venues],
  );

  // Square that encloses the outermost ring, so both rings + the user dot are
  // always framed regardless of where the nearby venues happen to fall.
  const ringsBounds = useMemo(() => {
    if (!showRings || !position) return null;
    const maxRadius = Math.max(...distanceRingsMiles!) * MILES_TO_METRES;
    return L.latLng(position.lat, position.lon).toBounds(2 * maxRadius);
  }, [showRings, position, distanceRingsMiles]);

  // In rings mode we frame the rings; otherwise the venues. Keeping these two
  // memos separate means geolocation resolving on the venues page can't nudge
  // the venue-framed view.
  const fitTarget = useMemo(
    () => ringsBounds ?? venuesBounds,
    [ringsBounds, venuesBounds],
  );

  // The first fit (on mount) is instant; afterwards, as the venues-page filter
  // narrows the set, markers drop out live but the map only re-frames once typing
  // settles — a debounced, animated fly to the matches, without lurching per key.
  useEffect(() => {
    if (!map || !fitTarget) return;

    if (!didFit.current) {
      map.fitBounds(fitTarget, { padding: FIT_PADDING });
      didFit.current = true;
      return;
    }

    const timer = setTimeout(() => {
      map.flyToBounds(fitTarget, {
        padding: FIT_PADDING,
        maxZoom: REFIT_MAX_ZOOM,
        duration: 0.6,
      });
    }, REFIT_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [map, fitTarget]);

  const handleLocate = useCallback(async () => {
    const pos = await requestLocation();
    if (pos && map) {
      map.flyTo([pos.lat, pos.lon], 14, { duration: 1 });
    }
  }, [requestLocation, map]);

  return (
    <div className={styles.wrapper}>
      <MapContainer
        className={styles.map}
        center={LONDON_CENTRE}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapRefBridge onMap={setMap} />
        {boundary && <GeoJSON data={boundary} style={() => BOUNDARY_STYLE} />}
        {showRings &&
          position &&
          distanceRingsMiles!.map((miles) => (
            <Circle
              key={`ring-${miles}`}
              center={[position.lat, position.lon]}
              radius={miles * MILES_TO_METRES}
              pathOptions={RING_STYLE}
            />
          ))}
        {showRings &&
          position &&
          distanceRingsMiles!.map((miles) => (
            <Marker
              key={`ring-label-${miles}`}
              position={[
                position.lat + miles / MILES_PER_DEGREE_LAT,
                position.lon,
              ]}
              icon={ringLabelIcon(`${miles} ${miles === 1 ? "mile" : "miles"}`)}
              interactive={false}
              keyboard={false}
            />
          ))}
        <MarkerClusterGroup
          iconCreateFunction={createClusterIcon}
          showCoverageOnHover={false}
          chunkedLoading
          maxClusterRadius={50}
        >
          {venues.map((venue) => (
            <Marker
              key={venue.id}
              position={[venue.lat, venue.lon]}
              icon={venueIcon}
              // Dim venues with nothing currently showing.
              opacity={venue.filmCount > 0 ? 1 : 0.5}
            >
              <Popup>
                <Link href={venue.href} className={styles.popupTitle}>
                  <MapPinIcon size={20} className={styles.popupIcon} />
                  {venue.name}
                </Link>
                <span className={styles.popupMeta}>
                  {venue.filmCount > 0
                    ? `${venue.filmCount.toLocaleString("en-GB")} ${
                        venue.filmCount === 1 ? "film" : "films"
                      } showing`
                    : "No showings currently listed"}
                </span>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        {position && (
          <Marker
            position={[position.lat, position.lon]}
            icon={userIcon}
            keyboard={false}
          >
            <Popup>
              <span className={styles.popupHeading}>You are here</span>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className={styles.controls}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLocate}
          disabled={loading}
        >
          {loading ? "Locating…" : position ? "Recentre on me" : "Locate me"}
        </Button>
      </div>

      {error && (
        <p className={styles.error} role="status">
          {error}
        </p>
      )}
    </div>
  );
}
