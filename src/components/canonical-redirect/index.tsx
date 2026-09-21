"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface CanonicalRedirectProps {
  canonicalUrl: string;
  /**
   * Carry the current query string and hash across. Needed where the old URL
   * took filter params (`/films?directors=…`), which would otherwise be lost.
   */
  preserveQuery?: boolean;
}

/**
 * Client component that redirects an alias URL to its canonical equivalent.
 * Rendered only when the current route is a non-canonical alias.
 */
export default function CanonicalRedirect({
  canonicalUrl,
  preserveQuery = false,
}: CanonicalRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const suffix = preserveQuery
      ? window.location.search + window.location.hash
      : "";
    router.replace(canonicalUrl + suffix);
  }, [canonicalUrl, preserveQuery, router]);

  return null;
}
