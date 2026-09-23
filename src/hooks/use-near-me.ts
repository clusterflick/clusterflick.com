"use client";

import { useEffect, useMemo } from "react";
import { useGeolocationContext } from "@/state/geolocation-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { getDistanceInMiles, getNearbyVenueIds } from "@/utils/geo-distance";
import { getLocalVenues, type LocalVenue } from "@/utils/get-local-venues";
import { getNearMeTodayUrl } from "@/utils/get-near-me-today-url";
import type { NearMeFilmClub, NearMeVenue } from "@/utils/get-near-me-data";
import type { Position } from "@/types";

export type NearbyVenue = NearMeVenue & { distance: number };

export interface NearMeState {
  position: Position | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<Position | null>;
  /**
   * The venues near the reader, closest first: the set the filter overlay's
   * "Venues near me" option selects (see `getNearbyVenueIds`), plus the
   * reader's locals. The page, its rows and the catalogue link it opens all
   * read this one set, so they always agree.
   */
  nearbyVenues: NearbyVenue[];
  nearbyVenueIds: ReadonlySet<string>;
  /** `/catalogue` opened on the nearby venues today; null until located. */
  todayHref: string | null;
  /** The reader's locals; null until the listings have loaded. */
  locals: LocalVenue[] | null;
  /** True once the full listings are in, so view-time rows can be computed. */
  dataReady: boolean;
}

/**
 * Everything location-dependent on `/near-me` and the home page's Near Me
 * section, computed once in one place so the two can't disagree.
 *
 * The nearby set is resolved from build-time venue counts, so the map and the
 * catalogue link appear as soon as the position does. Locals list real
 * screenings, so they wait for the full listings — which this starts loading
 * once there is a position to use them for.
 *
 * The locals are then added to the nearby set. The overlay's set stops growing
 * once it holds ten venues, which in a dense area is well inside half a mile,
 * while a local can be up to two miles off: without the union, "What's on near
 * me today" would leave out the very cinema the page just called your local.
 */
export function useNearMe(
  venues: NearMeVenue[],
  filmClubs: NearMeFilmClub[],
): NearMeState {
  const { position, loading, error, requestLocation } = useGeolocationContext();
  const { movies, isLoading, hasAttemptedLoad, getData } = useCinemaData();

  // getData returns early when the listings are loaded or already loading, so
  // this is safe beside the home page's own call.
  useEffect(() => {
    if (position) getData();
  }, [position]); // eslint-disable-line react-hooks/exhaustive-deps

  const dataReady =
    hasAttemptedLoad && !isLoading && Object.keys(movies).length > 0;

  const locals = useMemo(
    () =>
      position && dataReady
        ? getLocalVenues(position, venues, movies, filmClubs)
        : null,
    [position, dataReady, venues, movies, filmClubs],
  );

  const nearbyVenues = useMemo<NearbyVenue[]>(() => {
    if (!position) return [];
    const withShowings = new Set(
      venues.filter((v) => v.filmCount > 0).map((v) => v.id),
    );
    const ids = new Set(
      getNearbyVenueIds(
        position,
        venues.map((v) => ({ id: v.id, geo: { lat: v.lat, lon: v.lon } })),
        withShowings,
      ),
    );
    for (const { venue } of locals ?? []) ids.add(venue.id);
    return venues
      .filter((v) => ids.has(v.id))
      .map((v) => ({
        ...v,
        distance: getDistanceInMiles(position, { lat: v.lat, lon: v.lon }),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [position, venues, locals]);

  const nearbyVenueIds = useMemo(
    () => new Set(nearbyVenues.map((v) => v.id)),
    [nearbyVenues],
  );

  const todayHref = useMemo(
    () =>
      nearbyVenues.length > 0
        ? getNearMeTodayUrl(nearbyVenues.map((v) => v.id))
        : null,
    [nearbyVenues],
  );

  return {
    position,
    loading,
    error,
    requestLocation,
    nearbyVenues,
    nearbyVenueIds,
    todayHref,
    locals,
    dataReady,
  };
}
