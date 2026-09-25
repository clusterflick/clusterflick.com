"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * An element's content-box width, updating as it resizes. Null until the
 * element has mounted and been measured, so only use it for what can render a
 * fallback first. Returns a callback ref to attach to the element.
 */
export function useElementWidth<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const ref = useCallback((node: T | null) => setElement(node), []);

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [ref, width] as const;
}
