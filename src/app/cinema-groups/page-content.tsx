import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import LinkGrid from "@/components/link-grid";
import styles from "./page.module.css";

export type CinemaGroupListItem = {
  slug: string;
  name: string;
  href: string;
  description: string;
  venueCount: number;
};

interface CinemaGroupsPageContentProps {
  groups: CinemaGroupListItem[];
}

export default function CinemaGroupsPageContent({
  groups,
}: CinemaGroupsPageContentProps) {
  const totalVenues = groups.reduce((sum, g) => sum + g.venueCount, 0);

  return (
    <StandardPageLayout
      title="London Cinema Groups"
      subtitle={`${groups.length} cinema chains across London, from independent picture houses to major multiplexes`}
      backUrl="/venues"
      backText="All venues"
    >
      <ContentSection title="Browse London Cinemas by Group" as="h2">
        <p className={styles.intro}>
          Many of London&apos;s cinemas belong to a chain or group, each with
          its own character — from arthouse programmers and premium boutique
          cinemas to the big multiplex brands. Explore all{" "}
          {totalVenues.toLocaleString("en-GB")} venues across these{" "}
          {groups.length} groups to see every location and what&apos;s currently
          showing.
        </p>
      </ContentSection>

      <LinkGrid
        items={groups.map((group) => ({
          key: group.slug,
          href: group.href,
          label: group.name,
          count: group.venueCount,
        }))}
        minItemWidth={260}
      />
    </StandardPageLayout>
  );
}
