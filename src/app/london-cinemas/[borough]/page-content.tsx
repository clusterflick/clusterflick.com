import Link from "next/link";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import Tag from "@/components/tag";
import PreloadCinemaData from "@/components/preload-cinema-data";
import styles from "./page.module.css";

export type BoroughVenueItem = {
  id: string;
  name: string;
  href: string;
  type: string;
  eventCount: number;
};

export type NeighborBorough = {
  name: string;
  href: string;
  venueCount: number;
};

interface BoroughPageContentProps {
  boroughName: string;
  venues: BoroughVenueItem[];
  totalMovies: number;
  neighborBoroughs: NeighborBorough[];
}

export default function BoroughPageContent({
  boroughName,
  venues,
  totalMovies,
  neighborBoroughs,
}: BoroughPageContentProps) {
  const hasEvents = totalMovies > 0;

  return (
    <div>
      <PreloadCinemaData />
      <PageHeader backUrl="/london-cinemas" backText="All boroughs" />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backdropHeight="standard"
        align="center"
      >
        <OutlineHeading className={styles.title}>
          {`Cinemas in ${boroughName}`}
        </OutlineHeading>

        <div
          className={
            hasEvents ? styles.statusCardActive : styles.statusCardInactive
          }
        >
          {hasEvents ? (
            <p>
              <strong>{venues.length}</strong>{" "}
              {venues.length === 1 ? "venue" : "venues"} &middot;{" "}
              <strong>{totalMovies}</strong>{" "}
              {totalMovies === 1 ? "film" : "films"}
            </p>
          ) : (
            <p>
              <strong>{venues.length}</strong>{" "}
              {venues.length === 1 ? "venue" : "venues"} &middot; No showings
              currently listed
            </p>
          )}
        </div>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        <p className={styles.intro}>
          {venues.length === 1
            ? `There is 1 cinema venue in ${boroughName} tracked by Clusterflick.`
            : `There are ${venues.length} cinema venues in ${boroughName} tracked by Clusterflick.`}
          {totalMovies > 0
            ? ` Between them, ${totalMovies} ${totalMovies === 1 ? "film is" : "films are"} currently showing.`
            : ""}
        </p>

        <ContentSection title="Venues" as="h2">
          <ul className={styles.venueList}>
            {venues.map((venue) => (
              <li key={venue.id}>
                <Link href={venue.href} className={styles.venueLink}>
                  <span className={styles.venueName}>{venue.name}</span>
                  {venue.type.toLowerCase() !== "unknown" && (
                    <Tag color="blue" size="sm">
                      {venue.type}
                    </Tag>
                  )}
                  {venue.eventCount > 0 && (
                    <span className={styles.venueEventCount}>
                      {venue.eventCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </ContentSection>

        {neighborBoroughs.length > 0 && (
          <ContentSection title="Nearby Boroughs" as="h2">
            <ul className={styles.neighborList}>
              {neighborBoroughs.map((nb) => (
                <li key={nb.href}>
                  <Link href={nb.href} className={styles.neighborLink}>
                    <span className={styles.neighborName}>{nb.name}</span>
                    <span className={styles.neighborVenueCount}>
                      {nb.venueCount} {nb.venueCount === 1 ? "venue" : "venues"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </ContentSection>
        )}
      </div>
    </div>
  );
}
