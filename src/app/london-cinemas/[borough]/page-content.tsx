import Image from "next/image";
import Link from "next/link";
import type { AccessibilityFeature } from "@/types";
import {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_EMOJIS,
} from "@/utils/accessibility-labels";
import { formatDateShort } from "@/utils/format-date";
import StandardPageLayout from "@/components/standard-page-layout";
import ColumnsLayout from "@/components/columns-layout";
import ContentSection from "@/components/content-section";
import VenueCard from "@/components/venue-card";
import EventCard from "@/components/event-card";
import LinkedList from "@/components/linked-list";
import styles from "./page.module.css";

export type BoroughVenueItem = {
  id: string;
  name: string;
  href: string;
  type: string;
  eventCount: number;
  performanceCount: number;
  imagePath: string | null;
};

export type NeighborBorough = {
  name: string;
  href: string;
  venueCount: number;
};

export type BoroughFilmClub = {
  id: string;
  name: string;
  href: string;
  imagePath: string | null;
  seoDescription: string | null;
  movieCount: number;
};

export type BoroughFestival = {
  id: string;
  name: string;
  href: string;
  movieCount: number;
  dateFrom: number | null;
  dateTo: number | null;
};

export type BoroughAccessibilityStat = {
  feature: AccessibilityFeature;
  filmCount: number;
  performanceCount: number;
};

interface BoroughPageContentProps {
  boroughName: string;
  boroughSlug: string;
  boroughDescription: string;
  venues: BoroughVenueItem[];
  totalMovies: number;
  neighborBoroughs: NeighborBorough[];
  filmClubs: BoroughFilmClub[];
  festivals: BoroughFestival[];
  accessibilityStats: BoroughAccessibilityStat[];
}

export default function BoroughPageContent({
  boroughName,
  boroughSlug,
  boroughDescription,
  venues,
  totalMovies,
  neighborBoroughs,
  filmClubs,
  festivals,
  accessibilityStats,
}: BoroughPageContentProps) {
  const hasEvents = totalMovies > 0;
  const mapImagePath = `/images/boroughs/${boroughSlug}.png`;

  const hasFestivals = festivals.length > 0;
  const hasAccessibility = accessibilityStats.length > 0;
  const hasBoth = hasFestivals && hasAccessibility;

  const festivalsSection = hasFestivals ? (
    <ContentSection title="Festivals" as={hasBoth ? "h2" : "h3"}>
      <LinkedList
        items={festivals.map((festival) => {
          let detail = `${festival.movieCount} ${festival.movieCount === 1 ? "film" : "films"}`;
          if (
            festival.dateFrom !== null &&
            festival.dateTo !== null &&
            new Date(festival.dateFrom).toDateString() !==
              new Date(festival.dateTo).toDateString()
          ) {
            detail = `${formatDateShort(new Date(festival.dateFrom), { includeYearIfDifferent: true })} – ${formatDateShort(new Date(festival.dateTo), { includeYearIfDifferent: true })}`;
          }
          return {
            key: festival.id,
            href: festival.href,
            label: festival.name,
            detail,
          };
        })}
      />
    </ContentSection>
  ) : null;

  const accessibilitySection = hasAccessibility ? (
    <ContentSection
      title="Accessibility"
      as={hasBoth ? "h2" : "h3"}
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

  return (
    <StandardPageLayout
      title={`Cinemas in ${boroughName}, London`}
      heroExtra={
        <div
          className={
            hasEvents ? styles.statusCardActive : styles.statusCardInactive
          }
        >
          {hasEvents ? (
            <p>
              <strong>{venues.length.toLocaleString("en-GB")}</strong>{" "}
              {venues.length === 1 ? "venue" : "venues"} &middot;{" "}
              <strong>{totalMovies.toLocaleString("en-GB")}</strong>{" "}
              {totalMovies === 1 ? "film" : "films"}
            </p>
          ) : (
            <p>
              <strong>{venues.length.toLocaleString("en-GB")}</strong>{" "}
              {venues.length === 1 ? "venue" : "venues"} &middot; No showings
              currently listed
            </p>
          )}
        </div>
      }
      backUrl="/london-cinemas"
      backText="All boroughs"
    >
      <ColumnsLayout
        main={
          <>
            <p className={styles.description}>{boroughDescription}</p>
            <p className={styles.intro}>
              It is home to{" "}
              <strong>
                {venues.length} cinema venue{venues.length === 1 ? "" : "s"}
              </strong>
              .{" "}
              {totalMovies > 0 ? (
                <>
                  Between them,{" "}
                  <strong>
                    {totalMovies.toLocaleString("en-GB")}{" "}
                    {totalMovies === 1 ? "film is" : "films are"}
                  </strong>{" "}
                  currently showing. Browse the venues below to see what&apos;s
                  on, compare showtimes, and find your next screening.
                </>
              ) : (
                <>
                  Browse the venues below to explore what each one has to offer.
                </>
              )}
            </p>
          </>
        }
        sidebar={
          <>
            <div className={styles.mapContainer}>
              <Image
                src={mapImagePath}
                alt={`Map of ${boroughName} borough`}
                width={600}
                height={400}
                className={styles.mapImage}
              />
            </div>
            {!hasBoth && festivalsSection}
            {!hasBoth && accessibilitySection}
          </>
        }
      />

      {hasBoth && (
        <ColumnsLayout main={festivalsSection} sidebar={accessibilitySection} />
      )}

      <ContentSection title={`Cinema Venues in ${boroughName}`} as="h2">
        <div className={styles.venueGrid}>
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              href={venue.href}
              name={venue.name}
              type={venue.type}
              imagePath={venue.imagePath}
              filmCount={venue.eventCount}
              performanceCount={venue.performanceCount}
            />
          ))}
        </div>
      </ContentSection>

      {filmClubs.length > 0 && (
        <ContentSection title={`Film Clubs in ${boroughName}`} as="h2">
          <ul className={styles.clubGrid}>
            {filmClubs.map((club) => (
              <li key={club.id}>
                <EventCard
                  href={club.href}
                  name={club.name}
                  imagePath={club.imagePath}
                  description={club.seoDescription}
                  meta={
                    <span className={styles.filmCount}>
                      {club.movieCount}{" "}
                      {club.movieCount === 1 ? "film" : "films"}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </ContentSection>
      )}

      {neighborBoroughs.length > 0 && (
        <ContentSection title="Nearby Boroughs" as="h2">
          <LinkedList
            items={neighborBoroughs.map((nb) => ({
              key: nb.href,
              href: nb.href,
              label: nb.name,
              detail: `${nb.venueCount} ${nb.venueCount === 1 ? "venue" : "venues"}`,
            }))}
          />
        </ContentSection>
      )}
    </StandardPageLayout>
  );
}
