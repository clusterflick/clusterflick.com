import { Fragment, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import type { VenueAttributes } from "@/utils/get-venue-attributes";
import { AccessibilityFeature, type Movie, type Venue } from "@/types";
import {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_EMOJIS,
} from "@/utils/accessibility-labels";
import PageHeader from "@/components/page-header";
import DetailPageHero from "@/components/detail-page-hero";
import ColumnsLayout from "@/components/columns-layout";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import Tag from "@/components/tag";
import {
  LetterboxdIcon,
  InstagramIcon,
  XIcon,
  GoogleCalendarIcon,
  OutlookCalendarIcon,
  CalendarIcon,
} from "@/components/icons";
import LinkedList from "@/components/linked-list";
import FilmPosterGrid from "@/components/film-poster-grid";
import PreloadCinemaData from "@/components/preload-cinema-data";
import VenueDistance from "./venue-distance";
import NearbyVenues from "./nearby-venues";
import styles from "./page.module.css";

type SocialLink = {
  Icon: ComponentType<{ size?: number }>;
  name: string;
  url: string;
  handle: string;
};

function buildSocialLinks(attributes: VenueAttributes): SocialLink[] {
  const links: SocialLink[] = [];

  if (!attributes.socials) return links;

  if (attributes.socials.letterboxd) {
    links.push({
      Icon: LetterboxdIcon,
      name: "Letterboxd",
      url: `https://letterboxd.com/${attributes.socials.letterboxd}/`,
      handle: attributes.socials.letterboxd,
    });
  }
  if (attributes.socials.instagram) {
    links.push({
      Icon: InstagramIcon,
      name: "Instagram",
      url: `https://www.instagram.com/${attributes.socials.instagram}/`,
      handle: attributes.socials.instagram,
    });
  }
  if (attributes.socials.twitter) {
    links.push({
      Icon: XIcon,
      name: "X / Twitter",
      url: `https://x.com/${attributes.socials.twitter}/`,
      handle: attributes.socials.twitter,
    });
  }

  return links;
}

export type NearbyVenue = {
  venue: Venue;
  distance: number;
  url: string;
};

export type VenueBorough = {
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
  VenueBlurb: ComponentType | null;
  nearbyVenues: NearbyVenue[];
  borough?: VenueBorough | null;
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
  VenueBlurb,
  nearbyVenues,
  borough,
  activeFestivals,
  accessibilityStats,
}: VenueDetailPageContentProps) {
  const socialLinks = attributes ? buildSocialLinks(attributes) : [];
  const calendarUrl = `https://github.com/clusterflick/data-calendar/releases/latest/download/${venue.id}`;
  const webcalUrl = `webcal://github.com/clusterflick/data-calendar/releases/latest/download/${venue.id}`;

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
          href: `/?venues=${encodeURIComponent(venue.id)}&accessibility=${feature}`,
          label: `${ACCESSIBILITY_EMOJIS[feature]} ${ACCESSIBILITY_LABELS[feature]}`,
          detail: `${filmCount} ${filmCount === 1 ? "film" : "films"}`,
        }))}
      />
    </ContentSection>
  ) : null;

  return (
    <main id="main-content">
      <PreloadCinemaData />
      <PageHeader backUrl="/" backText="Back to film list" />

      <DetailPageHero
        name={venue.name}
        imagePath={imagePath}
        url={attributes?.url}
        movieCount={movieCount}
        performanceCount={performanceCount}
      >
        <div className={styles.heroTagRow}>
          <div className={styles.heroTagRowSide}>
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroSocialLink}
                title={link.name}
              >
                <link.Icon size={20} />
              </a>
            ))}
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

      <Divider />

      <div className={styles.content}>
        <ColumnsLayout
          main={
            VenueBlurb ? (
              <ContentSection title="About" as="h2">
                <div className={styles.blurb}>
                  <VenueBlurb />
                </div>
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
          <ColumnsLayout
            main={festivalsSection}
            sidebar={accessibilitySection}
          />
        )}
        {nearbyVenues.length > 0 && (
          <div>
            <ContentSection title={`Cinemas Near ${venue.name}`} as="h2">
              <NearbyVenues venues={nearbyVenues} />
            </ContentSection>
          </div>
        )}
      </div>

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
            exploreHref={`/?venues=${encodeURIComponent(venue.id)}`}
            exploreLabel={`Start exploring films at ${venue.name}`}
            showAll
          />
        </ContentSection>
      </div>
    </main>
  );
}
