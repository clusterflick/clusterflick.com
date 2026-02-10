import { useState, useEffect, useRef, type ReactNode } from "react";
import LoadingIndicator from "@/components/loading-indicator";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";

interface StoryDataLoaderProps<T> {
  /** Async function that returns data, or null on failure. Runs once on mount. */
  loader: () => Promise<T | null>;
  /** Message shown during loading. */
  loadingMessage?: string;
  /** Render function receiving the loaded data. */
  children: (data: T) => ReactNode;
}

/**
 * Generic data-loading wrapper for page stories.
 *
 * Handles the loading/error/success lifecycle and wraps the rendered
 * content with CinemaDataProvider, FilterConfigProvider and GeolocationProvider.
 */
export default function StoryDataLoader<T>({
  loader,
  loadingMessage = "Loading data...",
  children,
}: StoryDataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref keeps the loader stable across renders so the effect only runs once.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    loaderRef
      .current()
      .then((result) => {
        if (!result) {
          setError("Failed to load data");
        } else {
          setData(result);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#010013",
        }}
      >
        <LoadingIndicator message={loadingMessage} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#010013",
          color: "#fff",
        }}
      >
        {error || "No data available"}
      </div>
    );
  }

  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>{children(data)}</GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}
