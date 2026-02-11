"use client";

import { useEffect } from "react";
import Button from "@/components/button";
import StatusPage from "@/components/status-page";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Clears any client-side storage that could contain stale or corrupt data,
 * giving the app a clean slate on recovery.
 */
function clearClientStorage() {
  try {
    sessionStorage.clear();
  } catch {
    // Ignore — storage may be unavailable
  }
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[Clusterflick] Unhandled error:", error);
    // Eagerly clear storage so that "Try Again" or a manual refresh
    // doesn't hit the same corrupt state in a loop.
    clearClientStorage();
  }, [error]);

  return (
    <StatusPage
      iconSrc="/images/icons/neon-ticket-ripped.svg"
      title="Something Went Wrong"
      message={
        <>
          An unexpected error occurred.
          <br />
          Please try again or return to the home page.
        </>
      }
      actions={
        <>
          <Button onClick={reset}>Try Again</Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/")}
          >
            Go Home
          </Button>
        </>
      }
    />
  );
}
