import { type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import type { Movie, AccessibilityFeature } from "@/types";
import {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_EMOJIS,
} from "@/utils/accessibility-labels";
import StandardPageLayout from "@/components/standard-page-layout";
import DetailPageHero from "@/components/detail-page-hero";
import ColumnsLayout from "@/components/columns-layout";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import FilmPosterGrid from "@/components/film-poster-grid";
import VenueCard from "@/components/venue-card";
import LinkedList from "@/components/linked-list";
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
  /** Heading for the cinemas section. Defaults to `Cinemas`. */
  cinemasSectionTitle?: string;
  accessibilityStats?: AccessibilityStat[];
  /** Heading for the films grid. Defaults to `Films at {name}`. */
  filmsSectionTitle?: string;
  /** Href for the "explore" link below the films grid. Defaults to `/films`. */
  filmsExploreHref?: string;
  /** Label for the "explore" link below the films grid. */
  filmsExploreLabel?: string;
  /** Background image for the hero. Defaults to the decorative light circles. */
  heroBackgroundImage?: string;
  /** Alt text for a custom hero background image. */
  heroBackgroundImageAlt?: string;
  /** Content rendered inside the hero, below the title (e.g. an about blurb).
   *  Fills the hero so a photographic backdrop reads without a forced height. */
  heroChildren?: ReactNode;
  /**
   * How the cinemas/accessibility block is laid out:
   * - "sidebar" (default): alongside the "About" blurb in a two-column layout.
   * - "grid": full-width below the hero (use when the blurb is in the hero).
   */
  venuesLayout?: "sidebar" | "grid";
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
  cinemasSectionTitle = "Cinemas",
  accessibilityStats = [],
  filmsSectionTitle,
  filmsExploreHref = "/films",
  filmsExploreLabel = "Or start exploring all films",
  heroBackgroundImage,
  heroBackgroundImageAlt,
  heroChildren,
  venuesLayout = "sidebar",
}: EventDetailPageContentProps) {
  const cinemasSection =
    venues.length > 0 ? (
      <ContentSection title={cinemasSectionTitle} as="h2">
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
    ) : null;

  const accessibilitySection =
    accessibilityStats.length > 0 ? (
      <ContentSection
        title="Accessibility"
        as="h2"
        className={styles.accessibilitySection}
        intro={
          <Link href="/accessibility">
            Learn more about accessible screenings
          </Link>
        }
      >
        <LinkedList
          items={accessibilityStats.map(({ feature, filmCount }) => ({
            key: feature,
            href: `/accessibility/#${feature}`,
            label: `${ACCESSIBILITY_EMOJIS[feature]} ${ACCESSIBILITY_LABELS[feature]}`,
            detail: `${filmCount} ${filmCount === 1 ? "film" : "films"}`,
          }))}
        />
      </ContentSection>
    ) : null;

  const hasSecondaryContent =
    Boolean(Blurb) || Boolean(cinemasSection) || Boolean(accessibilitySection);

  // Secondary content rendered inside the constrained content wrapper, between
  // the hero and the films grid. Null when there's nothing to show (in which
  // case StandardPageLayout omits the wrapper and its divider entirely).
  const middleContent =
    venuesLayout === "grid"
      ? (cinemasSection || accessibilitySection) && (
          <>
            {cinemasSection}
            {accessibilitySection}
          </>
        )
      : hasSecondaryContent && (
          <ColumnsLayout
            main={
              Blurb ? (
                <ContentSection title="About" as="h2">
                  <div className={styles.blurb}>
                    <Blurb />
                  </div>
                </ContentSection>
              ) : null
            }
            sidebar={
              cinemasSection || accessibilitySection ? (
                <>
                  {cinemasSection}
                  {accessibilitySection}
                </>
              ) : null
            }
          />
        );

  return (
    <>
      {isAlias && <CanonicalRedirect canonicalUrl={canonicalUrl} />}
      <StandardPageLayout
        backUrl={backUrl}
        backText={backText}
        hero={
          <DetailPageHero
            name={name}
            imagePath={imagePath}
            url={url}
            movieCount={movieCount}
            performanceCount={performanceCount}
            backgroundImage={heroBackgroundImage}
            backgroundImageAlt={heroBackgroundImageAlt}
          >
            {heroChildren}
          </DetailPageHero>
        }
        afterContent={
          <>
            {middleContent && <Divider />}
            <div className={styles.filmsSection}>
              <ContentSection
                title={filmsSectionTitle ?? `Films at ${name}`}
                as="h2"
                className={styles.films}
              >
                <FilmPosterGrid
                  movies={gridMovies}
                  truncated={gridMoviesTruncated}
                  exploreHref={filmsExploreHref}
                  exploreLabel={filmsExploreLabel}
                  showAll
                />
              </ContentSection>
            </div>
          </>
        }
      >
        {middleContent || null}
      </StandardPageLayout>
    </>
  );
}
