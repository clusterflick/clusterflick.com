"use client";

import type { ReactNode } from "react";
import FeatureCarousel, {
  type FeatureCarouselItem,
} from "@/components/feature-carousel";
import PickCard from "@/components/pick-card";
import { useNow } from "@/hooks/use-now";
import {
  formatFeaturedWhen,
  getUpcomingFeatured,
  type FeaturedScreening,
} from "@/utils/get-featured-screenings";
import styles from "./page.module.css";

/** The hero rotates through the first few picks that have a poster. */
const HERO_LIMIT = 4;

function getWhen(item: FeaturedScreening, now: number): string {
  return item.performance
    ? formatFeaturedWhen(item.performance.time, now)
    : `${item.weekShowings.toLocaleString("en-GB")} showings this week`;
}

/**
 * Both halves read the reader's clock once the page is on it (`useNow`), so a
 * showing that has started since the build drops out and "Tomorrow" stays
 * true. The static HTML is rendered against `builtAt`.
 */
function useUpcoming(featured: FeaturedScreening[], builtAt: string) {
  const now = useNow(builtAt).getTime();
  return { now, upcoming: getUpcomingFeatured(featured, now) };
}

export function FeaturedHero({
  featured,
  builtAt,
}: {
  featured: FeaturedScreening[];
  builtAt: string;
}) {
  const { now, upcoming } = useUpcoming(featured, builtAt);
  const items: FeatureCarouselItem[] = upcoming
    .filter((item) => item.posterPath)
    .slice(0, HERO_LIMIT)
    .map((item) => ({
      id: item.movieId,
      href: item.href,
      title: item.title,
      posterPath: item.posterPath!,
      label: item.label,
      labelColor: item.tone,
      credit: item.credit,
      rating: item.rating,
      when: getWhen(item, now),
      where: item.performance?.venueName ?? null,
      whereHref: item.performance?.venueHref ?? null,
      overview: item.overview,
      trailerUrl: item.trailerUrl,
    }));
  if (items.length === 0) return null;
  return <FeatureCarousel items={items} label="Featured screenings" />;
}

export function FeaturedPicks({
  featured,
  builtAt,
  summary,
}: {
  featured: FeaturedScreening[];
  builtAt: string;
  /** The summary's prose, folded away beneath the cards it lists. */
  summary: ReactNode;
}) {
  const { now, upcoming } = useUpcoming(featured, builtAt);
  if (upcoming.length === 0) return null;
  return (
    <section className={styles.picks} aria-labelledby="picks-title">
      <h2 id="picks-title" className={styles.groupTitle}>
        This Week&apos;s Picks
      </h2>
      <p className={styles.groupIntro}>
        Screenings worth knowing about, chosen from this week&apos;s listings.
      </p>
      <div className={styles.picksGrid}>
        {upcoming.map((item) => (
          <PickCard
            key={item.movieId}
            item={{
              id: item.movieId,
              href: item.href,
              title: item.title,
              posterPath: item.posterPath,
              label: item.label,
              labelColor: item.tone,
              credit: item.credit,
              when: getWhen(item, now),
              where: item.performance?.venueName ?? null,
            }}
          />
        ))}
      </div>
      {summary && (
        <details className={styles.summaryNote}>
          <summary>Read this week&apos;s summary</summary>
          {summary}
        </details>
      )}
    </section>
  );
}
