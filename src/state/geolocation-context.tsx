"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Position } from "@/types";

type GeolocationContextType = {
  position: Position | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<Position | null>;
};

const Context = createContext<GeolocationContextType | undefined>(undefined);

/**
 * Provider to manage geolocation state at the app level.
 * This ensures the user's location persists across component mounts/unmounts
 * (e.g., when opening/closing the filter overlay).
 */
export function GeolocationProvider({ children }: { children: ReactNode }) {
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

  const contextValue = useMemo(
    () => ({
      position,
      loading,
      error,
      requestLocation,
    }),
    [position, loading, error, requestLocation],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

export function useGeolocationContext() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error(
      "useGeolocationContext must be used within a GeolocationProvider",
    );
  }
  return context;
}
