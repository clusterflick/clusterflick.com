import { Position } from "@/types";

export type GeolocationResult =
  | { success: true; position: Position }
  | { success: false; error: string };

// Default options for geolocation requests
const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 300000, // Cache position for 5 minutes
};

/**
 * Parse a GeolocationPositionError into a user-friendly message.
 */
function getErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was denied";
    case error.POSITION_UNAVAILABLE:
      return "Location information is unavailable";
    case error.TIMEOUT:
      return "Location request timed out";
    default:
      return "An unknown error occurred";
  }
}

/**
 * Fetch the user's geolocation position.
 * Returns a result object with either the position or an error message.
 */
export function fetchGeolocation(
  options?: Partial<PositionOptions>,
): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: "Geolocation is not supported by your browser",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (geoPosition) => {
        resolve({
          success: true,
          position: {
            lat: geoPosition.coords.latitude,
            lon: geoPosition.coords.longitude,
          },
        });
      },
      (geoError) => {
        resolve({
          success: false,
          error: getErrorMessage(geoError),
        });
      },
      { ...DEFAULT_OPTIONS, ...options },
    );
  });
}

/**
 * Fetch geolocation only if permission was previously granted.
 * Checks the Permissions API first to avoid prompting the user.
 * Returns position if available, null otherwise.
 */
export async function fetchGeolocationIfPermissionGranted(): Promise<Position | null> {
  // Check if Permissions API is available
  if (!navigator.permissions) {
    return null;
  }

  try {
    const permissionStatus = await navigator.permissions.query({
      name: "geolocation",
    });

    // Only fetch if permission was explicitly granted
    if (permissionStatus.state !== "granted") {
      return null;
    }

    const result = await fetchGeolocation({ timeout: 5000 });
    return result.success ? result.position : null;
  } catch {
    // Permissions API query failed
    return null;
  }
}
