import Image from "next/image";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import VenueCard from "@/components/venue-card";
import LinkedList from "@/components/linked-list";
import PreloadCinemaData from "@/components/preload-cinema-data";
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

interface BoroughPageContentProps {
  boroughName: string;
  boroughSlug: string;
  boroughDescription: string;
  venues: BoroughVenueItem[];
  totalMovies: number;
  neighborBoroughs: NeighborBorough[];
}

export default function BoroughPageContent({
  boroughName,
  boroughSlug,
  boroughDescription,
  venues,
  totalMovies,
  neighborBoroughs,
}: BoroughPageContentProps) {
  const hasEvents = totalMovies > 0;
  const mapImagePath = `/images/boroughs/${boroughSlug}.png`;

  return (
    <main id="main-content">
      <PreloadCinemaData />
      <PageHeader backUrl="/london-cinemas" backText="All boroughs" />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backgroundImageAlt="Decorative light circles"
        backdropHeight="standard"
        align="center"
      >
        <OutlineHeading className={styles.title}>
          {`Cinemas in ${boroughName}, London`}
        </OutlineHeading>

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
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        <div className={styles.introColumns}>
          <div className={styles.introText}>
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
          </div>

          <div className={styles.mapContainer}>
            <Image
              src={mapImagePath}
              alt={`Map of ${boroughName} borough`}
              width={600}
              height={400}
              className={styles.mapImage}
            />
          </div>
        </div>

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
      </div>
    </main>
  );
}
