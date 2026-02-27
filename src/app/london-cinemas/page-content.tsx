import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import LinkGrid from "@/components/link-grid";
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
    <StandardPageLayout
      title="London Cinemas"
      subtitle={`Find screening venues across ${totalBoroughs} London boroughs — from independent picture houses to major multiplex chains`}
      backUrl="/"
      backText="Back to film list"
    >
      <ContentSection title="Browse Cinemas by London Borough" as="h2">
        <p className={styles.intro}>
          London is home to one of the richest cinema scenes in the world.
          Whether you&apos;re looking for an independent arthouse cinema, a
          repertory venue screening classic films, or a modern multiplex showing
          the latest releases — you&apos;ll find it here. Browse by borough
          below to discover every cinema and screening venue in your part of
          London, see what&apos;s currently showing, and compare showtimes
          across venues.
        </p>
      </ContentSection>

      <LinkGrid
        items={boroughs.map((b) => ({
          key: b.slug,
          href: b.href,
          label: b.name,
          count: b.venueCount,
        }))}
        minItemWidth={260}
      />
    </StandardPageLayout>
  );
}
