import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
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
    <StandardPageLayout
      title="Venues"
      subtitle={`${totalVenues.toLocaleString("en-GB")} venues across London`}
      backUrl="/films"
      backText="Back to film list"
    >
      <p className={styles.intro}>
        Clusterflick tracks film screenings from{" "}
        {totalVenues.toLocaleString("en-GB")} venues across{" "}
        <Link href="/london-cinemas">all 33 boroughs of London</Link>, from{" "}
        <Link href="/cinema-groups">major cinema chains</Link> like{" "}
        <Link href="/cinema-groups/curzon">Curzon</Link>,{" "}
        <Link href="/cinema-groups/everyman">Everyman</Link>,{" "}
        <Link href="/cinema-groups/odeon">ODEON</Link> and{" "}
        <Link href="/cinema-groups/picturehouse">Picturehouse</Link> to
        independent cinemas, arts centres, museums, cultural institutes, bars
        and pop-up screening spaces. Whether you&apos;re looking for the latest
        blockbusters at a multiplex or a rare 35mm print at a neighbourhood
        arthouse, you&apos;ll find it here.
      </p>

      <VenueList groups={groups} />
    </StandardPageLayout>
  );
}
