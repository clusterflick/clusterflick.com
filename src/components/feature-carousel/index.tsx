"use client";

import { useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import Tag from "@/components/tag";
import { ButtonAnchor, ButtonLink } from "@/components/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useIsOnReaderClock } from "@/hooks/use-now";
import styles from "./feature-carousel.module.css";

export interface FeatureCarouselItem {
  /** Stable key, and the tab's identity. */
  id: string;
  href: string;
  title: string;
  /** Required: the poster is the slide's artwork and its colour wash. */
  posterPath: string;
  /** Why the film is featured: "One night only", "35mm print". */
  label: string;
  labelColor: "pink" | "blue" | "yellow" | "gray";
  /** "Akira Kurosawa · 1985". */
  credit?: string | null;
  /** "4.5/5 on Letterboxd". */
  rating?: string | null;
  /** "Sunday, 19:30", or the film's reach for a wide release. */
  when?: string | null;
  /** The venue, in pink beside the time. */
  where?: string | null;
  whereHref?: string | null;
  overview?: string | null;
  trailerUrl?: string | null;
}

interface FeatureCarouselProps {
  items: FeatureCarouselItem[];
  /** How long each slide shows before the next, in milliseconds. */
  interval?: number;
  /** Names the carousel for assistive technology. */
  label?: string;
}

const posterUrl = (path: string, size: "w342" | "w500") =>
  `https://image.tmdb.org/t/p/${size}${path}`;

/**
 * A full-width feature that rotates through a few films, each with its poster
 * fanned in front of the next and blurred behind the whole section as a wash of
 * its colours. A progress bar per film doubles as the way to pick one.
 *
 * Rotation holds while the pointer or keyboard focus is inside, can be paused,
 * and never starts for a reader who prefers reduced motion. The first film is
 * what the static HTML shows.
 */
export default function FeatureCarousel({
  items,
  interval = 8000,
  label = "Featured screenings",
}: FeatureCarouselProps) {
  const [requested, setRequested] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  // False through hydration, when the media query still reads false: timing a
  // bar then would end it at once for a reduced-motion reader, whose bars the
  // global stylesheet shortens to nothing, and skip a slide.
  const hydrated = useIsOnReaderClock();
  const baseId = useId();

  const count = items.length;
  if (count === 0) return null;
  // The list can shrink on the client, as showings lapse.
  const active = Math.min(requested, count - 1);
  const rotates = hydrated && count > 1 && !reducedMotion;
  const running = rotates && !paused && !held;
  const item = items[active];

  const select = (index: number) => setRequested((index + count) % count);

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (active + step + count) % count;
    select(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <section
      className={styles.feature}
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
      }}
    >
      <div className={styles.wash} aria-hidden="true">
        {items.map((slide, index) => (
          <div
            key={slide.id}
            className={clsx(styles.washLayer, index === active && styles.on)}
            style={{
              backgroundImage: `url(${posterUrl(slide.posterPath, "w342")})`,
            }}
          />
        ))}
      </div>

      <div className={styles.inner}>
        <div
          key={item.id}
          className={styles.text}
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active}`}
          aria-live={running ? "off" : "polite"}
        >
          <Tag color={item.labelColor} size="sm" className={styles.label}>
            {item.label}
          </Tag>
          <h2 className={styles.title}>
            <Link href={item.href}>{item.title}</Link>
          </h2>
          {(item.credit || item.rating) && (
            <p className={styles.meta}>
              {item.credit}
              {item.credit && item.rating && " · "}
              {item.rating && (
                <span className={styles.rating}>{item.rating}</span>
              )}
            </p>
          )}
          {(item.when || item.where) && (
            <p className={styles.when}>
              {item.when && <span>{item.when}</span>}
              {item.where &&
                (item.whereHref ? (
                  <Link href={item.whereHref} className={styles.where}>
                    {item.where}
                  </Link>
                ) : (
                  <span className={styles.where}>{item.where}</span>
                ))}
            </p>
          )}
          {item.overview && <p className={styles.overview}>{item.overview}</p>}
          <div className={styles.actions}>
            <ButtonLink href={item.href}>See showings →</ButtonLink>
            {item.trailerUrl && (
              <ButtonAnchor
                href={item.trailerUrl}
                variant="secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                ▶ Watch trailer
              </ButtonAnchor>
            )}
          </div>
        </div>

        <div className={styles.fan} aria-hidden="true">
          {items.map((slide, index) => (
            <Image
              key={slide.id}
              src={posterUrl(slide.posterPath, "w500")}
              alt=""
              width={500}
              height={750}
              priority={index === 0}
              className={styles.fanPoster}
              data-position={(index - active + count) % count}
            />
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className={styles.controls}>
          <div
            className={styles.tabs}
            role="tablist"
            aria-label={`Choose a film from ${label.toLowerCase()}`}
          >
            {items.map((slide, index) => {
              const selected = index === active;
              return (
                <button
                  key={slide.id}
                  id={`${baseId}-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  className={clsx(styles.tab, index < active && styles.seen)}
                  onClick={() => select(index)}
                  onKeyDown={onTabKeyDown}
                >
                  <span className={styles.tabTitle}>{slide.title}</span>
                  <span className={styles.bar}>
                    {selected && (
                      <span
                        // Remounted per slide, so the bar restarts from empty.
                        key={slide.id}
                        className={clsx(
                          styles.progress,
                          rotates && styles.timed,
                        )}
                        style={
                          {
                            "--interval": `${interval}ms`,
                            animationPlayState: running ? "running" : "paused",
                          } as CSSProperties
                        }
                        onAnimationEnd={() => select(active + 1)}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {rotates && (
            <button
              type="button"
              className={styles.pause}
              aria-label={paused ? "Play rotation" : "Pause rotation"}
              onClick={() => setPaused((value) => !value)}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true">
                {paused ? (
                  <path d="M2 1l9 5-9 5z" />
                ) : (
                  <>
                    <rect x="1.5" y="1" width="3" height="10" />
                    <rect x="7.5" y="1" width="3" height="10" />
                  </>
                )}
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
