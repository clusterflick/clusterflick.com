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
import { LetterboxdIcon, InstagramIcon, XIcon } from "@/components/icons";
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

export interface VenueDetailPageContentProps {
  venue: Venue;
  attributes: VenueAttributes | null;
  imagePath: string | null;
  mapImagePath: string | null;
  movieCount: number;
  performanceCount: number;
  gridMovies: { movie: Movie; performanceCount: number }[];
  VenueBlurb: ComponentType | null;
  nearbyVenues: NearbyVenue[];
}

export default function VenueDetailPageContent({
  venue,
  attributes,
  imagePath,
  mapImagePath,
  movieCount,
  performanceCount,
  gridMovies,
  VenueBlurb,
  nearbyVenues,
}: VenueDetailPageContentProps) {
  const hasEvents = performanceCount > 0;
  const socialLinks = attributes ? buildSocialLinks(attributes) : [];

  return (
    <div>
      <PreloadCinemaData />
      <PageHeader backUrl="/" backText="Back to film list" />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
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
        <div className={styles.heroLinks}>
          {venue.type.toLowerCase().trim() !== "unknown" ? (
            <Tag color="blue">{venue.type}</Tag>
          ) : null}
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
              <VenueDistance
                venueLat={venue.geo.lat}
                venueLon={venue.geo.lon}
                className={styles.distance}
              />
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
            <ContentSection title="Other Venues Nearby" as="h2">
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
          <a
            href={`/?venues=${encodeURIComponent(venue.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.exploreLink}
          >
            Start exploring films at {venue.name}
          </a>
          {gridMovies.length > 0 && (
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
                          movie.posterPath || includedWithPosters[0]?.posterPath
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
          )}
        </ContentSection>
      </div>
    </div>
  );
}
