import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import Tag from "@/components/tag";
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
          <div className={styles.venueGrid}>
            {venues.map((venue) => (
              <Link
                key={venue.id}
                href={venue.href}
                className={styles.venueCard}
              >
                <div className={styles.venueCardLogo}>
                  {venue.imagePath ? (
                    <Image
                      src={venue.imagePath}
                      alt={`${venue.name} logo`}
                      width={48}
                      height={48}
                      className={styles.venueCardImage}
                    />
                  ) : (
                    <span className={styles.venueCardInitial}>
                      {venue.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className={styles.venueCardBody}>
                  <span className={styles.venueCardName}>{venue.name}</span>
                  <div className={styles.venueCardMeta}>
                    <Tag color="blue" size="sm">
                      {venue.type.toLowerCase() === "unknown"
                        ? "Other"
                        : venue.type}
                    </Tag>
                  </div>
                  {venue.eventCount > 0 && (
                    <span className={styles.venueCardStats}>
                      {venue.eventCount}{" "}
                      {venue.eventCount === 1 ? "film" : "films"} &middot;{" "}
                      {venue.performanceCount}{" "}
                      {venue.performanceCount === 1 ? "showing" : "showings"}
                    </span>
                  )}
                </div>
              </Link>
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
    </div>
  );
}
