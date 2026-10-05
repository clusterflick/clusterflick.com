"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FilterId } from "@/lib/filters";
import {
  getPlaceFallbackLabel,
  getVenueIdsWithin,
  isPlaceResolvable,
  loadStations,
  parsePlaceRef,
  resolvePlace,
  type Station,
} from "@/lib/places";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import { useGeolocationContext } from "@/state/geolocation-context";

function sameIds(a: string[] | null, b: string[]): boolean {
  if (!a || a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

/**
 * Fills in the near filter's label and venues from its place, which is all a
 * URL carries: the pipeline has no venue coordinates or reader position of its
 * own, so the venues within the radius ride in the state, as the Seen ids do
 * for hide-seen. Recomputed whenever the place, the radius, the venues or the
 * reader's position change, so a link follows the dataset.
 *
 * Waits for the venue data before doing anything, which also means a page that
 * never loads the listings never asks for the reader's location.
 *
 * A station or venue the data doesn't hold resolves to no venues (and so no
 * results, where the suggestions offer to search all of London) rather than
 * being dropped, so the reader sees what the link asked for.
 *
 * Renders nothing. It sits inside all three providers it reads.
 */
export function NearFilterSync() {
  const { metaData } = useCinemaData();
  const { filterState, setNear } = useFilterConfig();
  const { position, loading, requestLocation } = useGeolocationContext();
  const near = filterState[FilterId.Near];
  const place = near?.place ?? null;
  const ref = useMemo(() => (place ? parsePlaceRef(place) : null), [place]);
  const venues = metaData?.venues ?? null;

  const [stations, setStations] = useState<Station[] | null>(null);
  useEffect(() => {
    if (ref?.kind !== "station" || stations) return;
    let cancelled = false;
    loadStations()
      .then((loaded) => {
        if (!cancelled) setStations(loaded);
      })
      // Left unresolved: the description still names the station from its
      // slug, and the next place change tries the load again.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ref, stations]);

  // "here" from a link: ask once. Picking it in the overlay asks first, so
  // this only fires for a link, which is itself the reader asking.
  const askedForLocation = useRef(false);
  useEffect(() => {
    if (ref?.kind !== "here" || !venues || position || loading) return;
    if (askedForLocation.current) return;
    askedForLocation.current = true;
    void requestLocation();
  }, [ref, venues, position, loading, requestLocation]);

  useEffect(() => {
    if (!near || !venues) return;

    if (!ref) {
      // Unreadable, which only stale session storage can produce.
      if (!sameIds(near.venues, [])) {
        setNear({ ...near, label: "a place no longer listed", venues: [] });
      }
      return;
    }

    const context = { venues, stations, position };
    if (!isPlaceResolvable(ref, context)) return;

    const resolved = resolvePlace(ref, context);
    const label = resolved?.label ?? getPlaceFallbackLabel(ref);
    const ids = resolved
      ? getVenueIdsWithin(resolved.point, near.radiusMiles, venues)
      : [];
    if (label === near.label && sameIds(near.venues, ids)) return;
    setNear({ ...near, label, venues: ids });
  }, [near, ref, venues, stations, position, setNear]);

  return null;
}
