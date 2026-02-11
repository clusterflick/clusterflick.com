import { Fragment, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import type { VenueAttributes } from "@/utils/get-venue-attributes";
import { getMovieUrl } from "@/utils/get-movie-url";
import type { Movie, Venue } from "@/types";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import Tag from "@/components/tag";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import {
  LetterboxdIcon,
  InstagramIcon,
  XIcon,
  GoogleCalendarIcon,
  OutlookCalendarIcon,
  CalendarIcon,
} from "@/components/icons";
import EmptyState from "@/components/empty-state";
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
}: VenueDetailPageContentProps) {
  const hasEvents = performanceCount > 0;
  const socialLinks = attributes ? buildSocialLinks(attributes) : [];
  const calendarUrl = `https://github.com/clusterflick/data-calendar/releases/latest/download/${venue.id}`;
  const webcalUrl = `webcal://github.com/clusterflick/data-calendar/releases/latest/download/${venue.id}`;

  return (
    <main id="main-content">
      <PreloadCinemaData />
      <PageHeader backUrl="/" backText="Back to film list" />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backgroundImageAlt="Decorative light circles"
        backdropHeight="standard"
        align="center"
        className={styles.hero}
      >
        {imagePath && (
          <div className={styles.venueImage}>
            <Image
              src={imagePath}
              alt={`${venue.name} logo`}
              width={160}
              height={160}
              className={styles.venueLogo}
            />
          </div>
        )}
        <OutlineHeading className={styles.title}>{venue.name}</OutlineHeading>

        {attributes && (
          <div className={styles.heroLinks}>
            <a
              href={attributes.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroLink}
            >
              {attributes.url}
            </a>
          </div>
        )}
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

        <div
          className={
            hasEvents ? styles.statusCardActive : styles.statusCardInactive
          }
        >
          {hasEvents ? (
            <p>
              <strong>{movieCount}</strong>{" "}
              {movieCount === 1 ? "film" : "films"} &middot;{" "}
              <strong>{performanceCount}</strong>{" "}
              {performanceCount === 1 ? "showing" : "showings"}
            </p>
          ) : (
            <p>No showings currently listed</p>
          )}
        </div>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        <div className={styles.columns}>
          {VenueBlurb && (
            <div className={styles.main}>
              <ContentSection title="About" as="h2">
                <div className={styles.blurb}>
                  <VenueBlurb />
                </div>
              </ContentSection>
            </div>
          )}

          <div className={styles.sidebar}>
            <ContentSection title="Address" as="h2">
              <p className={styles.address}>
                {venue.address.split(",").map((piece, index) => (
                  <Fragment key={index}>
                    {index === 0 ? "" : ","}{" "}
                    <span className={styles.nowrap}>{piece}</span>
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
          </div>
        </div>
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
          {gridMovies.length === 0 ? (
            <EmptyState
              icon={{
                src: "/images/icons/neon-ticket-ripped.svg",
                width: 120,
                height: 80,
              }}
              message="No showings currently listed"
              hint="Check back soon — new showings are added regularly"
            />
          ) : (
            <>
              <a
                href={`/?venues=${encodeURIComponent(venue.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.exploreLink}
              >
                Start exploring films at {venue.name}
              </a>
              <div
                className={
                  gridMoviesTruncated
                    ? styles.filmGridFadeWrapper
                    : styles.filmGridWrapper
                }
              >
                <div className={styles.filmGrid}>
                  {gridMovies.map(({ movie }) => {
                    const includedMovies = movie.includedMovies;
                    const includedWithPosters =
                      includedMovies?.filter((m) => m.posterPath) || [];
                    const totalPosters =
                      (movie.posterPath ? 1 : 0) + includedWithPosters.length;
                    const useStackedPoster =
                      includedMovies &&
                      includedMovies.length > 1 &&
                      totalPosters >= 2;

                    return (
                      <Link
                        key={movie.id}
                        href={getMovieUrl(movie)}
                        className={styles.filmGridLink}
                      >
                        {useStackedPoster ? (
                          <StackedPoster
                            mainPosterPath={movie.posterPath}
                            mainTitle={movie.title}
                            includedMovies={includedMovies}
                            subtitle={movie.year}
                            showOverlay
                          />
                        ) : (
                          <MoviePoster
                            posterPath={
                              movie.posterPath ||
                              includedWithPosters[0]?.posterPath
                            }
                            title={movie.title}
                            subtitle={movie.year}
                            showOverlay
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </ContentSection>
      </div>
    </main>
  );
}
