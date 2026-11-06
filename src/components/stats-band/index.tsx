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
  /**
   * Where the figure leads. Without one it is drawn as a plain figure, for a
   * count that is the whole story (a day's updates) rather than a way in.
   */
  href?: string;
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
 * A row of large linked figures, for the scale of something at a glance. When
 * the band starts below the fold, each figure counts up from zero as it
 * scrolls into view; a band already on screen at load keeps its numbers.
 *
 * The static HTML carries the real numbers, and so does any reader who prefers
 * reduced motion.
 */
export default function StatsBand({
  items,
  label = "At a glance",
}: StatsBandProps) {
  const bandRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    if (!band || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const numbers = [...band.querySelectorAll<HTMLElement>("[data-value]")];
    const showReal = () => {
      for (const number of numbers) {
        number.textContent = format(Number(number.dataset.value));
      }
    };
    let frame = 0;
    // Only ever counts figures nobody has read yet. A band already in view
    // when the page loads keeps the numbers its static HTML painted, since
    // zeroing them then would be a flicker over text being read. Off screen,
    // they are zeroed unseen and count up as the band scrolls in.
    let armed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!armed) {
          if (entry.isIntersecting) {
            observer.disconnect();
            return;
          }
          armed = true;
          for (const number of numbers) number.textContent = format(0);
          return;
        }
        if (entry.intersectionRatio < 0.4) return;
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
      { threshold: [0, 0.4] },
    );
    observer.observe(band);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      // Leave the real figures behind if unmounted mid-count.
      showReal();
    };
  }, [items]);

  return (
    <ul ref={bandRef} className={styles.band} aria-label={label}>
      {items.map((item) => {
        const className = clsx(
          styles.stat,
          item.href && styles.linked,
          item.highlight && styles.highlight,
        );
        const ariaLabel = [format(item.value), item.label, item.detail]
          .filter(Boolean)
          .join(" ");
        const content = (
          <>
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
          </>
        );

        return (
          <li key={item.id} className={styles.item}>
            {item.href ? (
              <Link
                href={item.href}
                className={className}
                aria-label={ariaLabel}
              >
                {content}
              </Link>
            ) : (
              // role="text" isn't standard; a labelled group reads the figure
              // as one phrase, as the link's label does.
              <div className={className} role="group" aria-label={ariaLabel}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
