import { type ComponentType } from "react";
import Link from "next/link";
import type { Movie, AccessibilityFeature } from "@/types";
import {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_EMOJIS,
} from "@/utils/accessibility-labels";
import PageHeader from "@/components/page-header";
import DetailPageHero from "@/components/detail-page-hero";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import FilmPosterGrid from "@/components/film-poster-grid";
import VenueCard from "@/components/venue-card";
import LinkedList from "@/components/linked-list";
import PreloadCinemaData from "@/components/preload-cinema-data";
import CanonicalRedirect from "@/components/canonical-redirect";
import styles from "./event-detail-page-content.module.css";

export type EventVenueItem = {
  id: string;
  name: string;
  href: string;
  type: string;
  imagePath: string | null;
  filmCount: number;
  performanceCount: number;
};

export type AccessibilityStat = {
  feature: AccessibilityFeature;
  filmCount: number;
  performanceCount: number;
};

export interface EventDetailPageContentProps {
  name: string;
  url: string;
  imagePath: string | null;
  movieCount: number;
  performanceCount: number;
  backUrl: string;
  backText: string;
  gridMovies: { movie: Movie; performanceCount: number }[];
  gridMoviesTruncated?: boolean;
  Blurb: ComponentType | null;
  isAlias: boolean;
  canonicalUrl: string;
  venues: EventVenueItem[];
  accessibilityStats?: AccessibilityStat[];
}

/**
 * Shared detail page layout for curated film programmes (festivals, film clubs, etc.).
 * Renders the hero, optional about blurb + cinemas sidebar, and the film grid.
 *
 * **When to use:**
 * - Detail pages for festivals, film clubs, or any named film programme.
 *
 * **When NOT to use:**
 * - Venue detail pages — those have their own layout.
 * - Movie detail pages.
 */
export default function EventDetailPageContent({
  name,
  url,
  imagePath,
  movieCount,
  performanceCount,
  backUrl,
  backText,
  gridMovies,
  gridMoviesTruncated,
  Blurb,
  isAlias,
  canonicalUrl,
  venues,
  accessibilityStats = [],
}: EventDetailPageContentProps) {
  return (
    <main id="main-content">
      <PreloadCinemaData />
      {isAlias && <CanonicalRedirect canonicalUrl={canonicalUrl} />}
      <PageHeader backUrl={backUrl} backText={backText} />

      <DetailPageHero
        name={name}
        imagePath={imagePath}
        url={url}
        movieCount={movieCount}
        performanceCount={performanceCount}
      />

      <Divider />

      {(Blurb || venues.length > 0 || accessibilityStats.length > 0) && (
        <>
          <div className={styles.content}>
            <div className={styles.columns}>
              {Blurb && (
                <div className={styles.main}>
                  <ContentSection title="About" as="h2">
                    <div className={styles.blurb}>
                      <Blurb />
                    </div>
                  </ContentSection>
                </div>
              )}
              {(venues.length > 0 || accessibilityStats.length > 0) && (
                <div className={styles.sidebar}>
                  {venues.length > 0 && (
                    <ContentSection title="Cinemas" as="h2">
                      <div className={styles.venueGrid}>
                        {venues.map((venue) => (
                          <VenueCard
                            key={venue.id}
                            href={venue.href}
                            name={venue.name}
                            type={venue.type}
                            imagePath={venue.imagePath}
                            filmCount={venue.filmCount}
                            performanceCount={venue.performanceCount}
                          />
                        ))}
                      </div>
                    </ContentSection>
                  )}
                  {accessibilityStats.length > 0 && (
                    <ContentSection
                      title="Accessibility"
                      as="h2"
                      className={styles.accessibilitySection}
                      intro={
                        <Link href="/accessibility">
                          Learn more about accessible screenings →
                        </Link>
                      }
                    >
                      <LinkedList
                        items={accessibilityStats.map(
                          ({ feature, filmCount }) => ({
                            key: feature,
                            href: `/accessibility/#${feature}`,
                            label: `${ACCESSIBILITY_EMOJIS[feature]} ${ACCESSIBILITY_LABELS[feature]}`,
                            detail: `${filmCount} ${filmCount === 1 ? "film" : "films"}`,
                          }),
                        )}
                      />
                    </ContentSection>
                  )}
                </div>
              )}
            </div>
          </div>
          <Divider />
        </>
      )}

      <div className={styles.filmsSection}>
        <ContentSection
          title={`Films at ${name}`}
          as="h2"
          className={styles.films}
        >
          <FilmPosterGrid
            movies={gridMovies}
            truncated={gridMoviesTruncated}
            exploreHref="/"
            exploreLabel="Or start exploring all films"
            showAll
          />
        </ContentSection>
      </div>
    </main>
  );
}
