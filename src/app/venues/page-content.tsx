import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import Divider from "@/components/divider";
import PreloadCinemaData from "@/components/preload-cinema-data";
import VenueList from "./venue-list";
import type { VenueGroupData } from "./page";
import styles from "./page.module.css";

interface VenuesPageContentProps {
  groups: VenueGroupData[];
  totalVenues: number;
}

export default function VenuesPageContent({
  groups,
  totalVenues,
}: VenuesPageContentProps) {
  return (
    <main id="main-content">
      <PreloadCinemaData />
      <PageHeader backUrl="/" backText="Back to film list" />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backgroundImageAlt="Decorative light circles"
        backdropHeight="standard"
        align="center"
      >
        <OutlineHeading className={styles.title}>Venues</OutlineHeading>
        <p className={styles.subtitle}>
          {totalVenues.toLocaleString("en-GB")} venues across London
        </p>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        <p className={styles.intro}>
          Clusterflick tracks film screenings from{" "}
          {totalVenues.toLocaleString("en-GB")} venues across London, from major
          cinema chains like Curzon, Everyman, ODEON and Picturehouse to
          independent cinemas, arts centres, museums, cultural institutes, bars
          and pop-up screening spaces. Whether you&apos;re looking for the
          latest blockbusters at a multiplex or a rare 35mm print at a
          neighbourhood arthouse, you&apos;ll find it here.
        </p>

        <VenueList groups={groups} />
      </div>
    </main>
  );
}
