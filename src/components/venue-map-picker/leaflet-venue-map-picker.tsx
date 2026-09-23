"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { useGeolocationContext } from "@/state/geolocation-context";
import Button from "@/components/button";
import {
  CARTO_ATTRIBUTION,
  CARTO_MAX_ZOOM,
  CARTO_SUBDOMAINS,
  CARTO_TILE_URL,
  DEFAULT_ZOOM,
  LONDON_CENTRE,
} from "@/components/venue-map/tiles";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import styles from "./venue-map-picker.module.css";

export interface VenueMapPickerVenue {
  id: string;
  name: string;
  lat: number;
  lon: number;
  filmCount: number;
}

const FIT_PADDING: [number, number] = [32, 32];
// Tighter than the browse map's 50: picking wants individual pins sooner.
const MAX_CLUSTER_RADIUS = 40;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A pin's icon carries its accessible name. Leaflet gives a keyboard-enabled
 * marker `role="button"` and fires `click` on Enter, so the text inside the
 * icon is what a screen reader announces — including whether it is selected,
 * which the colour alone cannot say.
 */
function venueIcon(venue: VenueMapPickerVenue, selected: boolean) {
  const label = `${venue.name}, ${selected ? "selected" : "not selected"}`;
  return L.divIcon({
    className: styles.venueMarker,
    html: `<span class="${styles.venuePin} ${
      selected ? styles.selected : styles.unselected
    } ${venue.filmCount > 0 ? "" : styles.empty}"></span><span class="${
      styles.visuallyHidden
    }">${escapeHtml(label)}</span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    tooltipAnchor: [0, -9],
  });
}

const userIcon = L.divIcon({
  className: styles.userMarker,
  html: `<span class="${styles.userDot}"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/**
 * Cluster bubbles say how much of what they hold is selected: filled when all
 * of it is, outlined when none is, and "3/12" in between — otherwise a
 * selection is invisible until you zoom in far enough to break every cluster.
 */
function createClusterIcon(
  cluster: L.MarkerCluster,
  selected: ReadonlySet<string>,
) {
  const markers = cluster.getAllChildMarkers();
  const total = markers.length;
  const selectedCount = markers.filter((m) =>
    selected.has((m.options as { venueId?: string }).venueId ?? ""),
  ).length;
  const tier = total < 10 ? "small" : total < 50 ? "medium" : "large";
  const state =
    selectedCount === total
      ? styles.clusterAll
      : selectedCount === 0
        ? styles.clusterNone
        : styles.clusterSome;
  const label =
    selectedCount === total || selectedCount === 0
      ? `${total}`
      : `${selectedCount}/${total}`;
  return L.divIcon({
    html: `<div class="${styles.cluster} ${styles[tier]} ${state}"><span>${label}</span></div>`,
    className: styles.clusterMarker,
    iconSize: L.point(40, 40, true),
  });
}

/** Reports the ids of the venues inside the visible map area. */
function ViewTracker({
  venues,
  onInViewChange,
}: {
  venues: VenueMapPickerVenue[];
  onInViewChange: (ids: string[]) => void;
}) {
  const map = useMap();

  const report = useCallback(() => {
    const bounds = map.getBounds();
    onInViewChange(
      venues
        .filter((v) => bounds.contains([v.lat, v.lon]))
        .map((venue) => venue.id),
    );
  }, [map, venues, onInViewChange]);

  useMapEvents({ moveend: report });

  // The first fit happens before this listener is attached, so report once
  // up front rather than waiting for the reader to pan.
  useEffect(() => {
    report();
  }, [report]);

  return null;
}

interface LeafletVenueMapPickerProps {
  venues: VenueMapPickerVenue[];
  selected: ReadonlySet<string>;
  onToggle: (venueId: string) => void;
  onInViewChange: (venueIds: string[]) => void;
}

export default function LeafletVenueMapPicker({
  venues,
  selected,
  onToggle,
  onInViewChange,
}: LeafletVenueMapPickerProps) {
  const { position, loading, error, requestLocation } = useGeolocationContext();
  const [map, setMap] = useState<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  // The cluster group builds its icons from options fixed at creation, so it
  // reads the selection through a ref and is told to redraw when it changes.
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
    clusterRef.current?.refreshClusters();
  }, [selected]);

  const iconCreateFunction = useCallback(
    (cluster: L.MarkerCluster) =>
      createClusterIcon(cluster, selectedRef.current),
    [],
  );

  // Open on the current selection, so a reader returning to adjust it starts
  // where they left off. Everything selected frames everything. Fitted once:
  // the selection changes under the reader's hands from then on.
  const didFit = useRef(false);
  useEffect(() => {
    if (!map || didFit.current || venues.length === 0) return;
    const framed = venues.filter((v) => selected.has(v.id));
    const target = framed.length > 0 ? framed : venues;
    map.fitBounds(
      L.latLngBounds(target.map((v) => [v.lat, v.lon] as [number, number])),
      { padding: FIT_PADDING, maxZoom: 14 },
    );
    didFit.current = true;
  }, [map, venues, selected]);

  const handleLocate = useCallback(async () => {
    const pos = await requestLocation();
    if (pos && map) {
      map.flyTo([pos.lat, pos.lon], 14, { duration: 1 });
    }
  }, [requestLocation, map]);

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        className={styles.map}
        center={LONDON_CENTRE}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        ref={setMap}
      >
        <TileLayer
          url={CARTO_TILE_URL}
          subdomains={CARTO_SUBDOMAINS}
          maxZoom={CARTO_MAX_ZOOM}
          attribution={CARTO_ATTRIBUTION}
        />
        <ViewTracker venues={venues} onInViewChange={onInViewChange} />
        <MarkerClusterGroup
          ref={clusterRef}
          iconCreateFunction={iconCreateFunction}
          showCoverageOnHover={false}
          chunkedLoading
          maxClusterRadius={MAX_CLUSTER_RADIUS}
        >
          {venues.map((venue) => (
            <PickerMarker
              key={venue.id}
              venue={venue}
              selected={selected.has(venue.id)}
              onToggle={onToggle}
            />
          ))}
        </MarkerClusterGroup>
        {position && (
          <Marker
            position={[position.lat, position.lon]}
            icon={userIcon}
            keyboard={false}
            interactive={false}
          />
        )}
      </MapContainer>

      <div className={styles.mapControls}>
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
        <p className={styles.mapError} role="status">
          {error}
        </p>
      )}
    </div>
  );
}

// Memoised so a toggle re-renders one pin rather than all four hundred.
const PickerMarker = memo(function PickerMarker({
  venue,
  selected,
  onToggle,
}: {
  venue: VenueMapPickerVenue;
  selected: boolean;
  onToggle: (venueId: string) => void;
}) {
  const position = useMemo<[number, number]>(
    () => [venue.lat, venue.lon],
    [venue.lat, venue.lon],
  );
  const icon = useMemo(() => venueIcon(venue, selected), [venue, selected]);
  const eventHandlers = useMemo(
    () => ({ click: () => onToggle(venue.id) }),
    [onToggle, venue.id],
  );
  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={eventHandlers}
      // Read by the cluster icon to count what it holds that is selected.
      {...({ venueId: venue.id } as object)}
    >
      <Tooltip direction="top">{venue.name}</Tooltip>
    </Marker>
  );
});
