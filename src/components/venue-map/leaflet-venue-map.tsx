"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
import {
  CARTO_ATTRIBUTION,
  CARTO_MAX_ZOOM,
  CARTO_SUBDOMAINS,
  CARTO_TILE_URL,
  DEFAULT_ZOOM,
  LONDON_CENTRE,
} from "./tiles";

export interface VenueMapVenue {
  id: string;
  name: string;
  href: string;
  type: string;
  lat: number;
  lon: number;
  filmCount: number;
  /** Drawn larger, above the clusters — the near-me page's locals. */
  highlighted?: boolean;
  /**
   * Replaces the popup's "N films showing" line, for a map whose venues are
   * about something narrower — a film page's map counts that film's showings.
   */
  detail?: string;
}

// After the filter narrows the markers, wait for typing to settle before
// animating the map to frame what's left.
const REFIT_DEBOUNCE_MS = 450;
// Stop a single-venue match from slamming all the way to street level.
const REFIT_MAX_ZOOM = 14;
const FIT_PADDING: [number, number] = [32, 32];
// How long the "use two fingers" / "use Ctrl + scroll" hint stays up after the
// gesture that prompted it stops.
const GESTURE_HINT_MS = 1500;

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

const highlightedVenueIcon = L.divIcon({
  className: styles.venueMarker,
  html: `<span class="${styles.venuePin} ${styles.venuePinHighlighted}"></span>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
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

function renderVenueMarker(
  venue: VenueMapVenue,
  icon: L.DivIcon,
  popupPadding?: Pick<
    L.PopupOptions,
    "autoPanPaddingTopLeft" | "autoPanPaddingBottomRight"
  >,
) {
  return (
    <Marker
      key={venue.id}
      position={[venue.lat, venue.lon]}
      icon={icon}
      // Dim venues with nothing currently showing.
      opacity={venue.filmCount > 0 ? 1 : 0.5}
      zIndexOffset={venue.highlighted ? 1000 : 0}
    >
      <Popup {...popupPadding}>
        <Link href={venue.href} className={styles.popupTitle}>
          <MapPinIcon size={20} className={styles.popupIcon} />
          {venue.name}
        </Link>
        <span className={styles.popupMeta}>
          {venue.detail ??
            (venue.filmCount > 0
              ? `${venue.filmCount.toLocaleString("en-GB")} ${
                  venue.filmCount === 1 ? "film" : "films"
                } showing`
              : "No showings currently listed")}
        </span>
      </Popup>
    </Marker>
  );
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
   * `[1, 2]`. When set (and a position is known) the map frames the venues and
   * the user together, falling back to the largest ring when there are no
   * venues. Used by the near-me page.
   */
  distanceRingsMiles?: number[];
  /** Fill the parent's height instead of the fixed in-page footprint. */
  fill?: boolean;
  /** Pixels at the top covered by an overlay; see `VenueMap`. */
  insetTop?: number;
  /**
   * Leave one-finger drags and plain wheel scrolls to the page, as an embedded
   * map should: on a touch screen the map pans with two fingers, and a wheel
   * zooms it only with Ctrl (⌘ on a Mac) held. Trackpad pinches arrive as
   * Ctrl + wheel, so they still zoom. A hint says so when the page scrolls
   * instead.
   */
  cooperativeGestures?: boolean;
}

function isApplePlatform() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

export default function LeafletVenueMap({
  venues,
  boundary,
  distanceRingsMiles,
  fill = false,
  insetTop = 0,
  cooperativeGestures = false,
}: LeafletVenueMapProps) {
  const { position, loading, error, requestLocation } = useGeolocationContext();
  const [map, setMap] = useState<L.Map | null>(null);
  const didFit = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // The text outlives `visible` so the hint can fade out rather than blank.
  const [gestureHint, setGestureHint] = useState({ text: "", visible: false });
  const fitPadding = useMemo(
    () => ({
      paddingTopLeft: L.point(FIT_PADDING[0], FIT_PADDING[1] + insetTop),
      paddingBottomRight: L.point(FIT_PADDING[0], FIT_PADDING[1]),
    }),
    [insetTop],
  );
  const popupPadding = useMemo(
    () =>
      insetTop
        ? {
            autoPanPaddingTopLeft: L.point(16, insetTop + 8),
            autoPanPaddingBottomRight: L.point(16, 16),
          }
        : undefined,
    [insetTop],
  );

  // On a touch-first device one finger scrolls the page: with Leaflet's drag
  // handler off, its container's touch-action lets the browser scroll, while
  // pinching still zooms and pans the map. Mouse-first devices keep dragging,
  // since a mouse drag never meant to scroll.
  useEffect(() => {
    if (!map || !cooperativeGestures) return;
    const coarse = window.matchMedia("(pointer: coarse)");
    const apply = () => {
      if (coarse.matches) map.dragging.disable();
      else map.dragging.enable();
    };
    apply();
    coarse.addEventListener("change", apply);
    return () => {
      coarse.removeEventListener("change", apply);
      map.dragging.enable();
    };
  }, [map, cooperativeGestures]);

  // Leaflet listens for wheel on its container, so a capturing listener on
  // the wrapper above it decides first: a plain wheel is stopped there (but
  // not prevented, so the page scrolls) and a Ctrl/⌘ wheel goes on to zoom.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !cooperativeGestures) return;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const showHint = (text: string) => {
      setGestureHint({ text, visible: true });
      clearTimeout(hideTimer);
      hideTimer = setTimeout(
        () => setGestureHint((hint) => ({ ...hint, visible: false })),
        GESTURE_HINT_MS,
      );
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.stopPropagation();
      showHint(
        isApplePlatform()
          ? "Use ⌘ + scroll to zoom the map"
          : "Use Ctrl + scroll to zoom the map",
      );
    };

    // A tap on a pin is one finger too, so only a moving finger — the page
    // scrolling where the reader may have meant the map — gets the hint.
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1 && !map?.dragging.enabled()) {
        showHint("Use two fingers to move the map");
      } else if (event.touches.length > 1) {
        clearTimeout(hideTimer);
        setGestureHint((hint) => ({ ...hint, visible: false }));
      }
    };

    wrapper.addEventListener("wheel", onWheel, { capture: true });
    wrapper.addEventListener("touchmove", onTouchMove, {
      capture: true,
      passive: true,
    });
    return () => {
      clearTimeout(hideTimer);
      wrapper.removeEventListener("wheel", onWheel, { capture: true });
      wrapper.removeEventListener("touchmove", onTouchMove, { capture: true });
    };
  }, [map, cooperativeGestures]);

  const showRings = !!distanceRingsMiles?.length && !!position;

  const venuesBounds = useMemo(
    () =>
      venues.length > 0
        ? L.latLngBounds(venues.map((v) => [v.lat, v.lon] as [number, number]))
        : null,
    [venues],
  );

  // In rings mode, frame the venues with the user dot, not the rings: framing
  // the outermost ring left the nearest venues bunched in the middle of an
  // empty two-mile circle. The rings are context and may run off the edge. With
  // no venues the ring is all there is to frame.
  const ringsBounds = useMemo(() => {
    if (!showRings || !position) return null;
    const here = L.latLng(position.lat, position.lon);
    if (venuesBounds) return L.latLngBounds([here, here]).extend(venuesBounds);
    const maxRadius = Math.max(...distanceRingsMiles!) * MILES_TO_METRES;
    return here.toBounds(2 * maxRadius);
  }, [showRings, position, distanceRingsMiles, venuesBounds]);

  // Keeping the venues page's target independent of the position means
  // geolocation resolving there can't nudge the venue-framed view.
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
      map.fitBounds(fitTarget, {
        ...fitPadding,
        maxZoom: REFIT_MAX_ZOOM,
      });
      didFit.current = true;
      return;
    }

    const timer = setTimeout(() => {
      map.flyToBounds(fitTarget, {
        ...fitPadding,
        maxZoom: REFIT_MAX_ZOOM,
        duration: 0.6,
      });
    }, REFIT_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [map, fitTarget, fitPadding]);

  const handleLocate = useCallback(async () => {
    const pos = await requestLocation();
    if (pos && map) {
      map.flyTo([pos.lat, pos.lon], 14, { duration: 1 });
    }
  }, [requestLocation, map]);

  return (
    <div
      ref={wrapperRef}
      className={fill ? `${styles.wrapper} ${styles.fill}` : styles.wrapper}
      // Read by the controls' offsets in the CSS.
      style={
        insetTop
          ? ({ "--inset-top": `${insetTop}px` } as CSSProperties)
          : undefined
      }
    >
      <MapContainer
        className={styles.map}
        center={LONDON_CENTRE}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
      >
        <TileLayer
          url={CARTO_TILE_URL}
          subdomains={CARTO_SUBDOMAINS}
          maxZoom={CARTO_MAX_ZOOM}
          attribution={CARTO_ATTRIBUTION}
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
          {venues
            .filter((venue) => !venue.highlighted)
            .map((venue) => renderVenueMarker(venue, venueIcon, popupPadding))}
        </MarkerClusterGroup>
        {/* Outside the cluster group, so a local never folds into a bubble. */}
        {venues
          .filter((venue) => venue.highlighted)
          .map((venue) =>
            renderVenueMarker(venue, highlightedVenueIcon, popupPadding),
          )}
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

      {/* Visual only: it describes pointer gestures, which a screen reader
          user isn't making, and keyboard panning is unaffected. */}
      <div
        className={styles.gestureHint}
        data-visible={gestureHint.visible || undefined}
        aria-hidden="true"
      >
        {gestureHint.text && <span>{gestureHint.text}</span>}
      </div>

      {error && (
        <p className={styles.error} role="status">
          {error}
        </p>
      )}
    </div>
  );
}
