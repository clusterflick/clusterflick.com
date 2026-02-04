"use client";

import { useState, useCallback } from "react";
import { Position } from "@/types";

type GeolocationState = {
  position: Position | null;
  loading: boolean;
  error: string | null;
};

type UseGeolocationReturn = GeolocationState & {
  requestLocation: () => Promise<Position | null>;
};

/**
 * Hook to manage geolocation state and requests.
 * Caches position for 5 minutes to avoid repeated prompts.
 */
export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<Position | null> => {
    // If we already have a position, return it immediately
    if (position) {
      return Promise.resolve(position);
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return Promise.resolve(null);
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (geoPosition) => {
          const newPosition: Position = {
            lat: geoPosition.coords.latitude,
            lon: geoPosition.coords.longitude,
          };
          setPosition(newPosition);
          setLoading(false);
          resolve(newPosition);
        },
        (geoError) => {
          setLoading(false);
          let errorMessage: string;
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage = "Location access was denied";
              break;
            case geoError.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              break;
            case geoError.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
            default:
              errorMessage = "An unknown error occurred";
          }
          setError(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache position for 5 minutes
        },
      );
    });
  }, [position]);

  return {
    position,
    loading,
    error,
    requestLocation,
  };
}
