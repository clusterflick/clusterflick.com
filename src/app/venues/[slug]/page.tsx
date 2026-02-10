import { Fragment, type ComponentType } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import slugify from "@sindresorhus/slugify";
import { getStaticData } from "@/utils/get-static-data";
import {
  getVenueAttributes,
  type VenueAttributes,
} from "@/utils/get-venue-attributes";
import { getVenueImagePath, getVenueMapPath } from "@/utils/get-venue-image";
import { getMovieUrl } from "@/utils/get-movie-url";
import type { Movie, Venue } from "@/types";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import Tag from "@/components/tag";
import MoviePoster from "@/components/movie-poster";
import { LetterboxdIcon, InstagramIcon, XIcon } from "@/components/icons";
import PreloadCinemaData from "@/components/preload-cinema-data";
import VenueDistance from "./venue-distance";
import styles from "./page.module.css";

export const dynamicParams = false;

let slugMap: Map<string, Venue> | null = null;

async function getSlugMap(): Promise<Map<string, Venue>> {
  if (slugMap) return slugMap;

  const data = await getStaticData();
  slugMap = new Map();

  for (const venue of Object.values(data.venues)) {
    slugMap.set(slugify(venue.name), venue);
  }

  return slugMap;
}

export async function generateStaticParams() {
  const map = await getSlugMap();
  return Array.from(map.keys()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const map = await getSlugMap();
  const venue = map.get(slug);

  if (!venue) {
    return { title: "Venue Not Found" };
  }

  const description = `Find film screenings at ${venue.name}. View listings, location, and more.`;

  return {
    title: venue.name,
    description,
    openGraph: {
      title: `${venue.name} | Clusterflick`,
      description,
    },
  };
}

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

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const map = await getSlugMap();
  const venue = map.get(slug);

  if (!venue) {
    notFound();
  }

  const data = await getStaticData();
  const attributes = getVenueAttributes(venue.id);
  const imagePath = getVenueImagePath(venue.id);
  const mapImagePath = getVenueMapPath(venue.id);

  let movieCount = 0;
  let performanceCount = 0;
  const venueMovies: { movie: Movie; performanceCount: number }[] = [];

  for (const movie of Object.values(data.movies)) {
    const venueShowingIds = new Set<string>();
    for (const [showingId, showing] of Object.entries(movie.showings)) {
      if (showing.venueId === venue.id) {
        venueShowingIds.add(showingId);
      }
    }
    if (venueShowingIds.size > 0) {
      movieCount++;
      let moviePerfCount = 0;
      for (const perf of movie.performances) {
        if (venueShowingIds.has(perf.showingId)) {
          performanceCount++;
          moviePerfCount++;
        }
      }
      venueMovies.push({ movie, performanceCount: moviePerfCount });
    }
  }

  // Sort by number of performances (most showings first), then alphabetically
  venueMovies.sort((a, b) => {
    if (b.performanceCount !== a.performanceCount) {
      return b.performanceCount - a.performanceCount;
    }
    return a.movie.title.localeCompare(b.movie.title);
  });

  const gridMovies = venueMovies.slice(0, 72);

  const hasEvents = performanceCount > 0;

  let VenueBlurb: ComponentType | null = null;
  try {
    const mod = await import(`@/components/venues/${venue.id}`);
    VenueBlurb = mod.default;
  } catch {
    // No blurb component for this venue
  }

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
              {gridMovies.map(({ movie }) => (
                <Link
                  key={movie.id}
                  href={getMovieUrl(movie)}
                  className={styles.filmGridLink}
                >
                  <MoviePoster
                    posterPath={
                      movie.posterPath ||
                      movie.includedMovies?.find((m) => m.posterPath)
                        ?.posterPath
                    }
                    title={movie.title}
                    subtitle={movie.year}
                    showOverlay
                  />
                </Link>
              ))}
            </div>
          )}
        </ContentSection>
      </div>
    </div>
  );
}
