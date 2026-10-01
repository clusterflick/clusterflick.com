import StandardPageLayout from "@/components/standard-page-layout";
import ProgrammeCard from "@/components/programme-card";
import PosterRow, { type PosterRowItem } from "@/components/poster-row";
import LinkGrid from "@/components/link-grid";
import { FILM_CLUB_KINDS } from "@/data/film-clubs";
import type { FilmClubListItem } from "@/utils/get-film-clubs-index";
import styles from "./page.module.css";

interface FilmClubsPageContentProps {
  /** Each club's next screening, soonest first. */
  nextUp: PosterRowItem[];
  /** Clubs with films showing, soonest next screening first. */
  activeClubs: FilmClubListItem[];
  inactiveClubs: FilmClubListItem[];
  activeCount: number;
  totalCount: number;
}

export default function FilmClubsPageContent({
  nextUp,
  activeClubs,
  inactiveClubs,
  activeCount,
  totalCount,
}: FilmClubsPageContentProps) {
  const subtitle =
    activeCount > 0
      ? `${activeCount} of ${totalCount} film clubs showing films`
      : `${totalCount} film clubs`;

  // Grouped by what each club is about, in the registry's order of kinds. A
  // kind with nothing showing is left out rather than headed over nothing.
  const groups = FILM_CLUB_KINDS.map((kind) => ({
    ...kind,
    clubs: activeClubs.filter((club) => club.kind === kind.id),
  })).filter((group) => group.clubs.length > 0);

  return (
    <StandardPageLayout title="Film Clubs" subtitle={subtitle}>
      <p className={styles.intro}>
        Clusterflick tracks screenings from London&apos;s specialist film clubs.
        These clubs run regular events covering everything from cult cinema to
        world film, genre nights to community screenings.
      </p>

      <PosterRow
        title="Next up"
        intro="The next screening from each club, soonest first."
        movies={nextUp}
        // A club's next screening is often outside the reader's filters (the
        // default week, or events hidden by category), which would open the
        // film on "No showings match your current filters". The club and
        // festival pages link their posters the same way.
        showAll
      />

      {groups.map((group) => (
        <section
          key={group.id}
          className={styles.section}
          aria-labelledby={`kind-${group.id}`}
        >
          <h2 id={`kind-${group.id}`} className={styles.sectionHeading}>
            {group.label}
          </h2>
          <ul className={styles.clubGrid}>
            {group.clubs.map((club) => (
              <li key={club.id}>
                <ProgrammeCard
                  href={club.href}
                  name={club.name}
                  imagePath={club.imagePath}
                  description={club.seoDescription}
                  posters={club.posters}
                  next={club.next}
                  meta={
                    <span className={styles.filmCount}>
                      {club.movieCount}{" "}
                      {club.movieCount === 1 ? "film" : "films"}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {inactiveClubs.length > 0 && (
        <section className={styles.section} aria-labelledby="other-clubs">
          <h2 id="other-clubs" className={styles.sectionHeading}>
            {activeClubs.length > 0 ? "Other clubs we follow" : "All clubs"}
          </h2>
          <p className={styles.sectionIntro}>
            Nothing on from these right now. Their screenings appear here as
            soon as they&apos;re announced.
          </p>
          <LinkGrid
            items={inactiveClubs.map((club) => ({
              key: club.id,
              href: club.href,
              label: club.name,
            }))}
          />
        </section>
      )}
    </StandardPageLayout>
  );
}
