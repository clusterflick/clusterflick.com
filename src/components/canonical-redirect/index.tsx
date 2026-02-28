"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface CanonicalRedirectProps {
  canonicalUrl: string;
}

/**
 * Client component that redirects an alias URL to its canonical equivalent.
 * Rendered only when the current route is a non-canonical alias.
 */
export default function CanonicalRedirect({
  canonicalUrl,
}: CanonicalRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(canonicalUrl);
  }, [canonicalUrl, router]);

  return null;
}
