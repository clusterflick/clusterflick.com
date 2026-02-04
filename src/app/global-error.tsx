"use client";

import { useEffect } from "react";
import Button from "@/components/button";
import styles from "./global-error.module.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for errors in the root layout.
 * This component must define its own <html> and <body> tags
 * since it replaces the root layout when triggered.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global application error:", error);
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
