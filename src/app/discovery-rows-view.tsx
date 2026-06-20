import PosterRow from "@/components/poster-row";
import type { DiscoveryRows } from "@/utils/get-discovery-movies";
import styles from "./page.module.css";

/**
 * Presentational render of the discovery rows. Universal (no client hooks), so
 * it's used both for the SSR fallback (build-time data) and the client refresh
 * (view-time data) — see DiscoverySections.
 */
export default function DiscoveryRowsView({ rows }: { rows: DiscoveryRows }) {
  const { popular, criticsPicks, newAdditions, lastChance, marathons } = rows;
  const hasNewAdditions =
    newAdditions.newReleases.length +
      newAdditions.returning.length +
      newAdditions.classics.length >
    0;

  return (
    <>
      <PosterRow
        title="Showing Across London"
        intro="The films showing most widely across the city this week."
        movies={popular}
      />

      <PosterRow
        title="Critics' Picks"
        intro="Highly rated films worth seeking out this week."
        movies={criticsPicks}
      />

      <PosterRow
        title="Marathons & Double Bills"
        intro="Multi-film events and double bills showing this week."
        movies={marathons}
      />

      {hasNewAdditions && (
        <section className={styles.group}>
          <h2 className={styles.groupTitle}>New Additions</h2>
          <p className={styles.groupIntro}>
            Screenings added in the past week.
          </p>
          <PosterRow
            title="New releases just added"
            titleAs="h3"
            movies={newAdditions.newReleases}
            showAll
          />
          <PosterRow
            title="Back on the big screen"
            titleAs="h3"
            movies={newAdditions.returning}
            showAll
          />
          <PosterRow
            title="Classics just added"
            titleAs="h3"
            movies={newAdditions.classics}
            showAll
          />
        </section>
      )}

      <PosterRow
        title="Last Chance"
        intro="Films with their final showing coming up soon!"
        movies={lastChance}
      />
    </>
  );
}
