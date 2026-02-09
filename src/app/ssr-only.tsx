"use client";

import { useState, useEffect, type ReactNode } from "react";

/**
 * Renders children during SSR and initial hydration, then removes them
 * once JS has loaded. Useful for SEO content that should only exist
 * in the static HTML.
 */
export default function SSROnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: need re-render after mount to remove SSR-only content
    setMounted(true);
  }, []);

  if (mounted) return null;
  return <>{children}</>;
}
