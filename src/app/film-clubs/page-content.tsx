import EventCard from "@/components/event-card";
import StandardPageLayout from "@/components/standard-page-layout";
import type { FilmClubListItem } from "./page";
import styles from "./page.module.css";

interface FilmClubsPageContentProps {
  activeClubs: FilmClubListItem[];
  inactiveClubs: FilmClubListItem[];
  activeCount: number;
  totalCount: number;
}

export default function FilmClubsPageContent({
  activeClubs,
  inactiveClubs,
  activeCount,
  totalCount,
}: FilmClubsPageContentProps) {
  const subtitle =
    activeCount === 0
      ? `${totalCount} clubs`
      : `${totalCount} clubs · ${activeCount} currently showing`;

  return (
    <StandardPageLayout
      title="Film Clubs"
      subtitle={subtitle}
      backUrl="/"
      backText="Back to film list"
    >
      <p className={styles.intro}>
        Clusterflick tracks screenings from London&apos;s specialist film clubs.
        These clubs run regular events covering everything from cult cinema to
        world film, genre nights to community screenings.
      </p>

      {activeClubs.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Currently showing</h2>
          <ul className={styles.clubGrid}>
            {activeClubs.map((club) => (
              <li key={club.id}>
                <EventCard
                  href={club.href}
                  name={club.name}
                  imagePath={club.imagePath}
                  description={club.seoDescription}
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
      )}

      {inactiveClubs.length > 0 && (
        <section className={styles.section}>
          {activeClubs.length > 0 && (
            <h2 className={styles.sectionHeading}>All clubs</h2>
          )}
          <ul className={styles.clubGrid}>
            {inactiveClubs.map((club) => (
              <li key={club.id}>
                <EventCard
                  href={club.href}
                  name={club.name}
                  imagePath={club.imagePath}
                  description={club.seoDescription}
                  meta={
                    <span className={styles.noFilms}>
                      No films currently showing
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </StandardPageLayout>
  );
}
