import { Fragment, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import type { VenueAttributes } from "@/utils/get-venue-attributes";
import { AccessibilityFeature, type Movie, type Venue } from "@/types";
import {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_EMOJIS,
} from "@/utils/accessibility-labels";
import StandardPageLayout from "@/components/standard-page-layout";
import DetailPageHero from "@/components/detail-page-hero";
import ColumnsLayout from "@/components/columns-layout";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import Tag from "@/components/tag";
import {
  GoogleCalendarIcon,
  OutlookCalendarIcon,
  CalendarIcon,
} from "@/components/icons";
import LinkedList from "@/components/linked-list";
import FilmPosterGrid from "@/components/film-poster-grid";
import PosterRow from "@/components/poster-row";
import VenueScheduleBoard from "@/components/venue-schedule-board";
import CollapsibleBoard from "@/components/venue-schedule-board/collapsible-board";
import type { VenueScheduleDay } from "@/utils/get-venue-schedule";
import type { ScoredMovie } from "@/utils/get-discovery-movies";
import SocialLinks from "@/components/social-links";
import VenueDistance from "./venue-distance";
import NearbyVenues from "./nearby-venues";
import styles from "./page.module.css";

export type NearbyVenue = {
  venue: Venue;
  distance: number;
  url: string;
};

export type VenueBorough = {
  name: string;
  href: string;
};

export type VenueGroupLink = {
  name: string;
  href: string;
};

export interface VenueDetailPageContentProps {
  venue: Venue;
  attributes: VenueAttributes | null;
  imagePath: string | null;
  mapImagePath: string | null;
  movieCount: number;
  performanceCount: number;
  gridMovies: { movie: Movie; performanceCount: number }[];
  gridMoviesTruncated?: boolean;
  scheduleDays: VenueScheduleDay[];
  justAdded: ScoredMovie[];
  VenueBlurb: ComponentType | null;
  nearbyVenues: NearbyVenue[];
  borough?: VenueBorough | null;
  group?: VenueGroupLink | null;
  activeFestivals: { name: string; href: string }[];
  accessibilityStats: {
    feature: AccessibilityFeature;
    filmCount: number;
    performanceCount: number;
  }[];
}

export default function VenueDetailPageContent({
  venue,
  attributes,
  imagePath,
  mapImagePath,
  movieCount,
  performanceCount,
  gridMovies,
  gridMoviesTruncated,
  scheduleDays,
  justAdded,
  VenueBlurb,
  nearbyVenues,
  borough,
  group,
  activeFestivals,
  accessibilityStats,
}: VenueDetailPageContentProps) {
  const calendarUrl = `https://github.com/clusterflick/data-calendar/releases/latest/download/${venue.id}`;
  const webcalUrl = `webcal://github.com/clusterflick/data-calendar/releases/latest/download/${venue.id}`;

  const venueMovieParams = `venues=${encodeURIComponent(venue.id)}`;
  const allVenueMovieParams = `${venueMovieParams}&allDates=true&allCategories=true`;
  const allVenueFilmsHref = `/films?${allVenueMovieParams}`;
  const hasJustAdded = justAdded.length > 0;

  const hasFestivals = activeFestivals.length > 0;
  const hasAccessibility = accessibilityStats.length > 0;
  const hasBoth = hasFestivals && hasAccessibility;

  const festivalsSection = hasFestivals ? (
    <ContentSection title="Festivals" as="h2">
      <LinkedList
        items={activeFestivals.map((festival) => ({
          key: festival.href,
          href: festival.href,
          label: festival.name,
        }))}
      />
    </ContentSection>
  ) : null;

  const accessibilitySection = hasAccessibility ? (
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
          href: `/films?venues=${encodeURIComponent(venue.id)}&accessibility=${feature}`,
          label: `${ACCESSIBILITY_EMOJIS[feature]} ${ACCESSIBILITY_LABELS[feature]}`,
          detail: `${filmCount} ${filmCount === 1 ? "film" : "films"}`,
        }))}
      />
    </ContentSection>
  ) : null;

  return (
    <StandardPageLayout
      backUrl="/films"
      backText="Back to film list"
      hero={
        <DetailPageHero
          name={venue.name}
          imagePath={imagePath}
          url={attributes?.url}
          movieCount={movieCount}
          performanceCount={performanceCount}
        >
          <div className={styles.heroTagRow}>
            <div className={styles.heroTagRowSide}>
              <SocialLinks socials={attributes?.socials} />
            </div>
            <div>
              <Tag color="blue">
                {venue.type.toLowerCase().trim() === "unknown"
                  ? "Other"
                  : venue.type}
              </Tag>
            </div>
            <div className={styles.heroTagRowSide}>
              <a
                href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroSocialLink}
                title="Add to Google Calendar"
              >
                <GoogleCalendarIcon size={20} />
              </a>
              <a
                href={`https://outlook.live.com/calendar/0/addfromweb/?url=${encodeURIComponent(calendarUrl)}&name=${encodeURIComponent(venue.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroSocialLink}
                style={{ padding: 4 }}
                title="Add to Outlook Calendar"
              >
                <OutlookCalendarIcon size={28} />
              </a>
              <a
                href={webcalUrl}
                className={styles.heroSocialLink}
                title="Subscribe to calendar"
              >
                <CalendarIcon size={20} />
              </a>
            </div>
          </div>
        </DetailPageHero>
      }
      afterContent={
        <>
          <Divider />
          <div className={styles.filmsSection}>
            <ContentSection
              title={`Films showing at ${venue.name}`}
              as="h2"
              className={styles.venueFilms}
            >
              <FilmPosterGrid
                movies={gridMovies}
                truncated={gridMoviesTruncated}
                venueId={venue.id}
                exploreHref={`/films?venues=${encodeURIComponent(venue.id)}&allDates=true&allCategories=true`}
                exploreLabel={`Start exploring films at ${venue.name}`}
                movieUrlParams={`venues=${encodeURIComponent(venue.id)}&allDates=true&allCategories=true`}
              />
            </ContentSection>
          </div>
        </>
      }
    >
      {movieCount > 0 && (
        <ContentSection title={`On now at ${venue.name}`} as="h2">
          <CollapsibleBoard>
            <VenueScheduleBoard
              days={scheduleDays}
              seeAllHref={allVenueFilmsHref}
              movieUrlParams={`${venueMovieParams}&allCategories=true`}
            />
          </CollapsibleBoard>
        </ContentSection>
      )}
      {hasJustAdded && (
        <div className={styles.justAddedRow}>
          <PosterRow
            title={`Just added to ${venue.name}`}
            intro="Screenings added here in the past week."
            movies={justAdded}
            movieUrlParams={allVenueMovieParams}
            showAll
          />
        </div>
      )}
      {movieCount > 0 && <Divider />}
      <ColumnsLayout
        main={
          VenueBlurb || group ? (
            <ContentSection title="About" as="h2">
              {VenueBlurb && (
                <div className={styles.blurb}>
                  <VenueBlurb />
                </div>
              )}
              {group && (
                <p className={styles.groupNote}>
                  Part of the <Link href={group.href}>{group.name} group</Link>.
                </p>
              )}
            </ContentSection>
          ) : null
        }
        sidebar={
          <>
            <ContentSection title="Address" as="h2">
              <p className={styles.address}>
                {venue.address.split(",").map((piece, index) => (
                  <Fragment key={index}>
                    {index === 0 ? "" : ","}{" "}
                    <span className="nowrap">{piece}</span>
                  </Fragment>
                ))}
              </p>
              {borough ? (
                <p className={styles.borough}>
                  Located in <Link href={borough.href}>{borough.name}</Link>
                  <VenueDistance
                    venueLat={venue.geo.lat}
                    venueLon={venue.geo.lon}
                    parenthesized
                  />
                </p>
              ) : (
                <VenueDistance
                  venueLat={venue.geo.lat}
                  venueLon={venue.geo.lon}
                  className={styles.distance}
                />
              )}
              {mapImagePath && (
                <p>
                  <a
                    href={`https://www.google.com/maps?q=${venue.geo.lat},${venue.geo.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={mapImagePath}
                      alt={`Map showing location of ${venue.name}`}
                      width={600}
                      height={400}
                      className={styles.mapImage}
                    />
                  </a>
                </p>
              )}
            </ContentSection>
            {!hasBoth && festivalsSection}
            {!hasBoth && accessibilitySection}
          </>
        }
      />
      {hasBoth && (
        <ColumnsLayout main={festivalsSection} sidebar={accessibilitySection} />
      )}
      {nearbyVenues.length > 0 && (
        <div>
          <ContentSection title={`Cinemas Near ${venue.name}`} as="h2">
            <NearbyVenues venues={nearbyVenues} />
          </ContentSection>
        </div>
      )}
    </StandardPageLayout>
  );
}
