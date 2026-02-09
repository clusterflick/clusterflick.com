"use client";

import { useState, useEffect, type ReactNode } from "react";
import styles from "./page.module.css";

const STORAGE_KEY = "clusterflick-intro-collapsed";

interface IntroSectionProps {
  heading: ReactNode;
  children: ReactNode;
  signOff: ReactNode;
}

export default function IntroSection({
  heading,
  children,
  signOff,
}: IntroSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Read persisted state after hydration
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- valid: localStorage not available during SSR
        setIsExpanded(false);
      }
    } catch {
      // Ignore - localStorage may not be available
    }
  }, []);

  return (
    <section className={styles.intro}>
      <div className={styles.introHeader}>
        {heading}
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => {
            const next = !isExpanded;
            setIsExpanded(next);
            try {
              if (next) {
                localStorage.removeItem(STORAGE_KEY);
              } else {
                localStorage.setItem(STORAGE_KEY, "true");
              }
            } catch {
              // Ignore
            }
          }}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      {isExpanded ? (
        <div className={styles.introBody}>{children}</div>
      ) : (
        <div className={styles.collapsedIndicator} aria-hidden="true">
          ···
        </div>
      )}
      {signOff}
    </section>
  );
}
