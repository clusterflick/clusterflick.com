"use client";

import { useEffect } from "react";
import Button from "@/components/button";
import styles from "./global-error.module.css";

interface GlobalErrorProps {
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

/**
 * Global error boundary for errors in the root layout.
 * This component must define its own <html> and <body> tags
 * since it replaces the root layout when triggered.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Clusterflick] Unhandled global error:", error);
    // Eagerly clear storage so that "Try Again" or a manual refresh
    // doesn't hit the same corrupt state in a loop.
    clearClientStorage();
  }, [error]);

  return (
    <html lang="en">
      <body className={styles.body}>
        <div className={styles.content}>
          <h1 className={styles.title}>Something Went Wrong</h1>
          <p className={styles.message}>
            A critical error occurred. Please try refreshing the page.
          </p>
          <Button onClick={reset}>Try Again</Button>
        </div>
      </body>
    </html>
  );
}
