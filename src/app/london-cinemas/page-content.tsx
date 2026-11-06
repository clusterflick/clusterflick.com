import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import LinkGrid from "@/components/link-grid";
import BoroughMap from "@/components/borough-map";
import RankedBarChart from "@/components/ranked-bar-chart";
import type { BoroughListItem } from "./page";
import type { BoroughWeek } from "./get-borough-week";
import styles from "./page.module.css";

interface LondonCinemasPageContentProps {
  boroughs: BoroughListItem[];
  totalBoroughs: number;
  map: BoroughWeek["map"];
  /** Films showing in the coming week, per borough, every borough included. */
  week: BoroughWeek["week"];
  /** The day the week was counted from, e.g. "Friday 6 November 2026". */
  countedOn: string;
}

const films = (count: number) =>
  `${count.toLocaleString("en-GB")} ${count === 1 ? "film" : "films"}`;

export default function LondonCinemasPageContent({
  boroughs,
  totalBoroughs,
  map,
  week,
  countedOn,
}: LondonCinemasPageContentProps) {
  // Most and fewest among the boroughs with a venue: one with none has
  // nothing to count, and the map already says so.
  const ranked = week
    .filter((borough) => borough.href)
    .sort((a, b) => b.films - a.films);
  const most = ranked[0];
  const fewest = ranked[ranked.length - 1];

  return (
    <StandardPageLayout
      title="London Cinemas"
      subtitle={`What's on this week across ${totalBoroughs} London boroughs — from independent picture houses to major multiplex chains`}
    >
      <ContentSection title="What's On, Borough by Borough" as="h2">
        <p className={styles.intro}>
          London has one of the richest cinema scenes in the world, but it
          isn&apos;t spread evenly.
          {most && fewest && most !== fewest && (
            <>
              {" "}
              This week {most.name} has the most on, with {films(most.films)},
              and {fewest.name} the least, with {films(fewest.films)}.
            </>
          )}{" "}
          Pick a borough to see its cinemas and what they&apos;re showing.
        </p>
        <BoroughMap
          viewBox={map.viewBox}
          items={map.items}
          bands={map.bands}
          caption="Films showing in the next 7 days"
          prompt="Point at a borough to see what's on there"
        />
      </ContentSection>

      <ContentSection title="Every Borough This Week" as="h2">
        <RankedBarChart
          caption="Films showing in the next 7 days, by borough"
          labelHeading="Borough"
          valueHeading="Films"
          items={week.map((borough) => ({
            key: borough.slug,
            label: borough.name,
            value: borough.films,
            href: borough.href,
          }))}
        />
        <p className={styles.note}>
          Counted over the seven days from {countedOn}, and recounted every time
          the listings update. Films are what the catalogue shows by default
          (films, multi-film events and shorts), so quizzes, talks and other
          events aren&apos;t included. A film showing at two venues in a borough
          counts once.
        </p>
      </ContentSection>

      <ContentSection title="Browse Cinemas by London Borough" as="h2">
        <LinkGrid
          items={boroughs.map((b) => ({
            key: b.slug,
            href: b.href,
            label: b.name,
            count: b.venueCount,
          }))}
          minItemWidth={260}
        />
      </ContentSection>
    </StandardPageLayout>
  );
}
