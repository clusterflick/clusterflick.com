"use client";

import { useEffect, useState } from "react";
import { useUserContext } from "@/state/user-context";
import {
  CAPABILITIES,
  getGrantedCapabilities,
  type CapabilityId,
} from "@/lib/user-capabilities";
import styles from "./page.module.css";

/**
 * Names the features granted to this reader that are still being built, so a
 * grant is visible before there is anything to configure. Nothing renders for
 * a reader with none, or if the capabilities can't be read: they're news, not
 * something the page depends on.
 */
export default function ComingSoon() {
  const { readCapabilities } = useUserContext();
  const [granted, setGranted] = useState<CapabilityId[]>([]);

  useEffect(() => {
    let cancelled = false;
    readCapabilities().then(
      (capabilities) => {
        if (!cancelled) setGranted(getGrantedCapabilities(capabilities));
      },
      (error) => console.error("Failed to load capabilities", error),
    );
    return () => {
      cancelled = true;
    };
  }, [readCapabilities]);

  if (granted.length === 0) return null;

  return (
    <aside className={styles.comingSoon} aria-labelledby="coming-soon-title">
      <h2 id="coming-soon-title" className={styles.comingSoonTitle}>
        Coming soon to your account
      </h2>
      <ul className={styles.comingSoonList}>
        {granted.map((id) => (
          <li key={id}>
            <strong>{CAPABILITIES[id].title}.</strong>{" "}
            {CAPABILITIES[id].comingSoon}
          </li>
        ))}
      </ul>
    </aside>
  );
}
