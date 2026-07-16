import Image from "next/image";
import Link from "next/link";
import { getVenueGroupTitle } from "@/utils/get-venue-group-url";
import type { SocialHandles } from "@/utils/build-social-links";
import type { Movie } from "@/types";
import StandardPageLayout from "@/components/standard-page-layout";
import ColumnsLayout from "@/components/columns-layout";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import VenueCard from "@/components/venue-card";
import SocialLinks from "@/components/social-links";
import FilmPosterGrid from "@/components/film-poster-grid";
import styles from "./page.module.css";

export type GroupVenueItem = {
  id: string;
  name: string;
  href: string;
  type: string;
  eventCount: number;
  performanceCount: number;
  imagePath: string | null;
};

interface GroupPageContentProps {
  name: string;
  slug: string;
  description: string;
  logoPath: string | null;
  socials: SocialHandles;
  venues: GroupVenueItem[];
  totalMovies: number;
  gridMovies: { movie: Movie; performanceCount: number }[];
  gridMoviesTruncated?: boolean;
  venueIds: string[];
}

export default function GroupPageContent({
  name,
  slug,
  description,
  logoPath,
  socials,
  venues,
  totalMovies,
  gridMovies,
  gridMoviesTruncated,
  venueIds,
}: GroupPageContentProps) {
  const hasEvents = totalMovies > 0;
  const mapImagePath = `/images/venue-groups/${slug}.png`;

  // Link to the film list pre-filtered to this group's venues.
  const venuesParam = venueIds.map((id) => encodeURIComponent(id)).join(",");
  const filmsQuery = `base=all&venues=${venuesParam}`;
  const filmsHref = `/films?${filmsQuery}`;

  return (
    <StandardPageLayout
      title={getVenueGroupTitle(name)}
      heroExtra={
        <div className={styles.hero}>
          {logoPath && (
            <div className={styles.logo}>
              <Image
                src={logoPath}
                alt={`${name} logo`}
                width={72}
                height={72}
                className={styles.logoImage}
              />
            </div>
          )}
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
          <SocialLinks socials={socials} />
        </div>
      }
      backUrl="/cinema-groups"
      backText="All cinema groups"
      afterContent={
        hasEvents ? (
          <>
            <Divider />
            <div className={styles.filmsSection}>
              <ContentSection
                title={`Films showing at ${name}`}
                as="h2"
                className={styles.groupFilms}
              >
                <FilmPosterGrid
                  movies={gridMovies}
                  truncated={gridMoviesTruncated}
                  venueId={venueIds}
                  exploreHref={filmsHref}
                  exploreLabel={`Start exploring films at ${name}`}
                  movieUrlParams={filmsQuery}
                />
              </ContentSection>
            </div>
          </>
        ) : null
      }
    >
      <ColumnsLayout
        main={
          <>
            <p className={styles.description}>{description}</p>
            <p className={styles.intro}>
              {name} has{" "}
              <strong>
                {venues.length} London cinema
                {venues.length === 1 ? "" : "s"}
              </strong>
              .{" "}
              {totalMovies > 0 ? (
                <>
                  Between them,{" "}
                  <Link href={filmsHref}>
                    <strong>
                      {totalMovies.toLocaleString("en-GB")}{" "}
                      {totalMovies === 1 ? "film" : "films"}
                    </strong>
                  </Link>{" "}
                  {totalMovies === 1 ? "is" : "are"} currently showing. Browse
                  the venues below to see what&apos;s on, compare showtimes, and
                  find your next screening.
                </>
              ) : (
                <>
                  Browse the venues below to explore each location and see
                  what&apos;s coming up.
                </>
              )}
            </p>
          </>
        }
        sidebar={
          <div className={styles.mapContainer}>
            <Image
              src={mapImagePath}
              alt={`Map of ${name} cinema locations across London`}
              width={600}
              height={400}
              className={styles.mapImage}
            />
          </div>
        }
      />

      <ContentSection title={`${name} venues in London`} as="h2">
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
    </StandardPageLayout>
  );
}
