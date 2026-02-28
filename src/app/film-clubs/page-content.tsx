import Image from "next/image";
import NavCard from "@/components/nav-card";
import StandardPageLayout from "@/components/standard-page-layout";
import type { FilmClubListItem } from "./page";
import styles from "./page.module.css";

interface FilmClubsPageContentProps {
  activeClubs: FilmClubListItem[];
  inactiveClubs: FilmClubListItem[];
  activeCount: number;
  totalCount: number;
}

function ClubCard({ club }: { club: FilmClubListItem }) {
  return (
    <NavCard href={club.href} className={styles.clubCard}>
      <div className={styles.clubCardLogo}>
        {club.imagePath ? (
          <Image
            src={club.imagePath}
            alt={`${club.name} logo`}
            width={96}
            height={96}
            className={styles.clubLogo}
          />
        ) : (
          <div className={styles.clubLogoPlaceholder} />
        )}
      </div>
      <div className={styles.clubCardBody}>
        <div className={styles.clubCardName}>{club.name}</div>
        <p className={styles.clubCardDescription}>
          {club.seoDescription
            ? club.seoDescription.charAt(0).toUpperCase() +
              club.seoDescription.slice(1)
            : ""}
        </p>
        <div className={styles.clubCardMeta}>
          {club.movieCount > 0 ? (
            <span className={styles.clubFilmCount}>
              {club.movieCount} {club.movieCount === 1 ? "film" : "films"}
            </span>
          ) : (
            <span className={styles.clubNoFilms}>No films currently showing</span>
          )}
        </div>
      </div>
    </NavCard>
  );
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
                <ClubCard club={club} />
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
                <ClubCard club={club} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </StandardPageLayout>
  );
}
