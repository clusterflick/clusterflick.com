import StandardPageLayout from "@/components/standard-page-layout";
import ProgrammeCard from "@/components/programme-card";
import LinkGrid from "@/components/link-grid";
import { getLede } from "@/utils/get-lede";
import type { CinemaGroupsIndex } from "@/utils/get-cinema-groups-index";
import styles from "./page.module.css";

type CinemaGroupsPageContentProps = CinemaGroupsIndex;

const plural = (count: number, one: string, many: string) =>
  `${count.toLocaleString("en-GB")} ${count === 1 ? one : many}`;

export default function CinemaGroupsPageContent({
  activeGroups,
  inactiveGroups,
  totalVenues,
  totalScreenings,
}: CinemaGroupsPageContentProps) {
  const groups = [...activeGroups, ...inactiveGroups];
  const chainVenues = groups.reduce((sum, g) => sum + g.venueCount, 0);
  const chainScreenings = activeGroups.reduce(
    (sum, g) => sum + g.screenings,
    0,
  );
  // The chains' share of the week against their share of the venues: the
  // one figure the page can give that no single chain's page can.
  const percent = (part: number, whole: number) =>
    Math.round((part / whole) * 100);
  const showShares = totalVenues > 0 && totalScreenings > 0;

  return (
    <StandardPageLayout
      title="London Cinema Groups"
      subtitle={`What's on this week at ${plural(groups.length, "cinema chain", "cinema chains")} across London, from arthouse picture houses to the big multiplexes`}
    >
      <p className={styles.intro}>
        Many of London&apos;s cinemas belong to a chain, each with its own
        character.
        {showShares && (
          <>
            {" "}
            Between them, these {plural(
              chainVenues,
              "venue",
              "venues",
            )} are {percent(chainVenues, totalVenues)}% of the places we list,
            but this week they run {percent(chainScreenings, totalScreenings)}%
            of London&apos;s screenings.
          </>
        )}{" "}
        Each card leads with the films only that chain is showing, so you can
        see what sets it apart.
      </p>

      <ul className={styles.grid}>
        {activeGroups.map((group) => (
          <li key={group.slug}>
            <ProgrammeCard
              href={group.href}
              name={group.name}
              imagePath={group.imagePath}
              description={getLede(group.description)}
              posters={group.posters}
              meta={
                <span className={styles.meta}>
                  {/* "Only here" sits beside the film count it is a part
                      of, so it reads as films; beside the venues it read
                      as venues. */}
                  <span className={styles.filmCount}>
                    {plural(group.films, "film", "films")}
                    {group.onlyHere > 0 &&
                      ` · ${group.onlyHere.toLocaleString("en-GB")} only here`}
                  </span>
                  <span className={styles.detail}>
                    {plural(group.screenings, "showing", "showings")} at{" "}
                    {plural(group.venueCount, "venue", "venues")}
                  </span>
                </span>
              }
            />
          </li>
        ))}
      </ul>

      {inactiveGroups.length > 0 && (
        <section className={styles.section} aria-labelledby="other-groups">
          <h2 id="other-groups" className={styles.sectionHeading}>
            {activeGroups.length > 0 ? "Nothing on this week" : "All chains"}
          </h2>
          <p className={styles.sectionIntro}>
            Their screenings appear here as soon as they&apos;re announced.
          </p>
          <LinkGrid
            items={inactiveGroups.map((group) => ({
              key: group.slug,
              href: group.href,
              label: group.name,
              count: group.venueCount,
            }))}
          />
        </section>
      )}
    </StandardPageLayout>
  );
}
