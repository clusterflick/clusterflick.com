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
        <OutlineHeading className={styles.title}>London Cinemas</OutlineHeading>
        <p className={styles.subtitle}>
          Find screening venues across {totalBoroughs} London boroughs — from
          independent picture houses to major multiplex chains
        </p>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        <ContentSection title="Browse Cinemas by London Borough" as="h2">
          <p className={styles.intro}>
            London is home to one of the richest cinema scenes in the world.
            Whether you&apos;re looking for an independent arthouse cinema, a
            repertory venue screening classic films, or a modern multiplex
            showing the latest releases — you&apos;ll find it here. Browse by
            borough below to discover every cinema and screening venue in your
            part of London, see what&apos;s currently showing, and compare
            showtimes across venues.
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
