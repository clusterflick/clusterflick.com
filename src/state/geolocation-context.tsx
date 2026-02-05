"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import { Position } from "@/types";
import {
  fetchGeolocation,
  fetchGeolocationIfPermissionGranted,
} from "@/utils/fetch-geolocation";

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

  // On mount, try to fetch position if permission was previously granted.
  useEffect(() => {
    fetchGeolocationIfPermissionGranted().then((pos) => {
      if (pos) setPosition(pos);
    });
  }, []);

  const requestLocation = useCallback(async (): Promise<Position | null> => {
    // If we already have a position, return it immediately
    if (position) {
      return position;
    }

    setLoading(true);
    setError(null);

    const result = await fetchGeolocation();

    setLoading(false);

    if (result.success) {
      setPosition(result.position);
      return result.position;
    } else {
      setError(result.error);
      return null;
    }
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
