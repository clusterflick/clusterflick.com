"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const interval = setInterval(onChange, MINUTE);
  return () => clearInterval(interval);
}

// Floored to the minute so the snapshot is stable between reads, as
// useSyncExternalStore requires
const getSnapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;

/**
 * The current time, to the minute, ticking each minute. Server rendering and
 * hydration see `fallback` instead - the moment the static page was built -
 * so the HTML matches the first client render, and the page then moves onto
 * the reader's clock. For anything that has to stay true after a static page
 * stops being rebuilt.
 */
export function useNow(fallback: string): Date {
  const now = useSyncExternalStore(subscribe, getSnapshot, () =>
    new Date(fallback).getTime(),
  );
  return new Date(now);
}
