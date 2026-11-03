"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import styles from "./stats-band.module.css";

export interface StatsBandItem {
  /** Stable key. */
  id: string;
  value: number;
  /** Short uppercase label under the number: "Films". */
  label: string;
  /** What the number counts: "showing this week". */
  detail?: string;
  href: string;
  /** Picks the number out in yellow, for the one that is a curiosity. */
  highlight?: boolean;
}

interface StatsBandProps {
  items: StatsBandItem[];
  /** Names the band for assistive technology. */
  label?: string;
}

const COUNT_UP_MS = 1400;
const format = (value: number) => value.toLocaleString("en-GB");

/**
 * A row of large linked figures, for the scale of something at a glance. Each
 * figure counts up from zero once, the first time the band scrolls into view.
 *
 * The static HTML carries the real numbers, and so does any reader who prefers
 * reduced motion: the count-up only ever rewrites text that is already right.
 */
export default function StatsBand({
  items,
  label = "At a glance",
}: StatsBandProps) {
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    if (!band || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const numbers = [...band.querySelectorAll<HTMLElement>("[data-value]")];
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / COUNT_UP_MS);
          const eased = 1 - Math.pow(1 - progress, 4);
          for (const number of numbers) {
            number.textContent = format(
              Math.round(Number(number.dataset.value) * eased),
            );
          }
          if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    observer.observe(band);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      // Leave the real figures behind if unmounted mid-count.
      for (const number of numbers) {
        number.textContent = format(Number(number.dataset.value));
      }
    };
  }, [items]);

  return (
    <div ref={bandRef} className={styles.band} role="list" aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          role="listitem"
          className={clsx(styles.stat, item.highlight && styles.highlight)}
          aria-label={[format(item.value), item.label, item.detail]
            .filter(Boolean)
            .join(" ")}
        >
          <span className={styles.value} data-value={item.value} aria-hidden>
            {format(item.value)}
          </span>
          <span className={styles.label} aria-hidden>
            {item.label}
          </span>
          {item.detail && (
            <span className={styles.detail} aria-hidden>
              {item.detail}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
