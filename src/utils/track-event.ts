declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Send a custom event to umami. No-ops on the dev server (and any non-production
 * build) so local activity doesn't pollute analytics, and stays safe if the
 * umami script hasn't loaded (e.g. blocked by an ad blocker).
 */
export function trackEvent(
  eventName: string,
  data?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window === "undefined") return;
  window.umami?.track(eventName, data);
}
