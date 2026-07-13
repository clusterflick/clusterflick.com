"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
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
}

export default function LeafletVenueMap({
  venues,
  boundary,
}: LeafletVenueMapProps) {
  const { position, loading, error, requestLocation } = useGeolocationContext();
  const [map, setMap] = useState<L.Map | null>(null);
  const didFit = useRef(false);

  const bounds = useMemo(
    () =>
      venues.length > 0
        ? L.latLngBounds(venues.map((v) => [v.lat, v.lon] as [number, number]))
        : null,
    [venues],
  );

  // Frame the current venues. The first fit (on mount) is instant; afterwards,
  // as the filter narrows the set, markers drop out live but the map only
  // re-frames once typing settles — a debounced, animated fly to the remaining
  // matches so people can see where they are, without lurching per keystroke.
  useEffect(() => {
    if (!map || !bounds) return;

    if (!didFit.current) {
      map.fitBounds(bounds, { padding: FIT_PADDING });
      didFit.current = true;
      return;
    }

    const timer = setTimeout(() => {
      map.flyToBounds(bounds, {
        padding: FIT_PADDING,
        maxZoom: REFIT_MAX_ZOOM,
        duration: 0.6,
      });
    }, REFIT_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [map, bounds]);

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
