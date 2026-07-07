"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { useCinemaData } from "@/state/cinema-data-context";
import EmptyState from "@/components/empty-state";
import styles from "./film-poster-grid.module.css";

export interface FilmPosterGridItem {
  id: string;
  node: ReactNode;
}

interface FilmPosterGridClientProps {
  items: FilmPosterGridItem[];
  truncated?: boolean;
  exploreHref?: string;
  exploreLabel?: string;
  /**
   * When set, prune any grid item that no longer has a current performance at
   * this venue (or, given an array, any of these venues) once the client cinema
   * data has loaded. The static HTML ships the full (build-time) list, then
   * stale entries disappear after hydration.
   */
  venueId?: string | string[];
}

export default function FilmPosterGridClient({
  items,
  truncated,
  exploreHref,
  exploreLabel,
  venueId,
}: FilmPosterGridClientProps) {
  const { movies, isLoading, hasAttemptedLoad, error } = useCinemaData();

  // Only prune once the load has fully settled — pruning mid-load (while chunks
  // are still arriving) would flicker items out and back in. On error, keep the
  // static list rather than hiding everything.
  const ready = hasAttemptedLoad && !isLoading && !error;

  const venueIds =
    venueId === undefined
      ? null
      : new Set(Array.isArray(venueId) ? venueId : [venueId]);

  const visibleItems = ready
    ? items.filter(({ id }) => {
        const movie = movies[id];
        // Movie pruned entirely (all performances in the past) → hide it.
        if (!movie) return false;
        if (!venueIds) return true;
        // Keep only if a remaining (future) performance is at one of these venues.
        return movie.performances.some((perf) =>
          venueIds.has(movie.showings[perf.showingId]?.venueId ?? ""),
        );
      })
    : items;

  if (visibleItems.length === 0) {
    return (
      <EmptyState
        icon={{
          src: "/images/icons/neon-ticket-ripped.svg",
          width: 120,
          height: 80,
        }}
        message="No showings currently listed"
        hint="Check back soon — new showings are added regularly"
      />
    );
  }

  return (
    <>
      {exploreHref && exploreLabel && (
        <Link href={exploreHref} className={styles.exploreLink}>
          {exploreLabel}
        </Link>
      )}
      <div
        className={
          truncated ? styles.filmGridFadeWrapper : styles.filmGridWrapper
        }
      >
        <div className={styles.filmGrid}>
          {visibleItems.map(({ node }) => node)}
        </div>
      </div>
    </>
  );
}
