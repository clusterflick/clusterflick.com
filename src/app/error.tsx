"use client";

import { useEffect } from "react";
import Button from "@/components/button";
import StatusPage from "@/components/status-page";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
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
