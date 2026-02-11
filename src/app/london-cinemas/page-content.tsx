import Link from "next/link";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import PreloadCinemaData from "@/components/preload-cinema-data";
import type { BoroughListItem } from "./page";
import styles from "./page.module.css";

interface LondonCinemasPageContentProps {
  boroughs: BoroughListItem[];
  totalBoroughs: number;
}

export default function LondonCinemasPageContent({
  boroughs,
  totalBoroughs,
}: LondonCinemasPageContentProps) {
  return (
    <div>
      <PreloadCinemaData />
      <PageHeader backUrl="/" backText="Back to film list" />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backdropHeight="standard"
        align="center"
      >
        <OutlineHeading className={styles.title}>
          London Cinemas by Borough
        </OutlineHeading>
        <p className={styles.subtitle}>
          Cinemas across {totalBoroughs} London boroughs
        </p>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        <ContentSection title="Explore London Cinemas by Borough" as="h2">
          <p className={styles.intro}>
            Explore cinemas across London by borough. Each area page shows all
            the venues Clusterflick tracks in that part of London, from
            independent arthouse cinemas to major multiplex chains.
          </p>
        </ContentSection>

        <ul className={styles.boroughList}>
          {boroughs.map((borough) => (
            <li key={borough.slug}>
              <Link href={borough.href} className={styles.boroughLink}>
                <span className={styles.boroughName}>{borough.name}</span>
                <span className={styles.boroughVenueCount}>
                  {borough.venueCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
