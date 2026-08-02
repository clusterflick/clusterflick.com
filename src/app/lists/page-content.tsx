import EventCard from "@/components/event-card";
import StandardPageLayout from "@/components/standard-page-layout";
import type { MovieListItem } from "./page";
import styles from "./page.module.css";

interface ListsPageContentProps {
  activeLists: MovieListItem[];
  inactiveLists: MovieListItem[];
  totalCount: number;
}

export default function ListsPageContent({
  activeLists,
  inactiveLists,
  totalCount,
}: ListsPageContentProps) {
  const subtitle = `${totalCount} ${totalCount === 1 ? "list" : "lists"}`;

  return (
    <StandardPageLayout
      title="Film Lists"
      subtitle={subtitle}
      backUrl="/films"
      backText="Back to film list"
    >
      <p className={styles.intro}>
        The great-films lists that critics and audiences keep arguing about —
        matched against what is actually screening in London. Each page shows
        only the films from that list you can still go and see, and links back
        to the list it came from.
      </p>

      {activeLists.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Currently showing</h2>
          <ul className={styles.listGrid}>
            {activeLists.map((list) => (
              <li key={list.id}>
                <EventCard
                  href={list.href}
                  name={list.name}
                  imagePath={list.imagePath}
                  description={list.description}
                  meta={
                    <>
                      <span className={styles.filmCount}>
                        {list.movieCount}{" "}
                        {list.movieCount === 1 ? "film" : "films"} showing
                      </span>
                      <span className={styles.source}>{list.sourceName}</span>
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {inactiveLists.length > 0 && (
        <section className={styles.section}>
          {activeLists.length > 0 && (
            <h2 className={styles.sectionHeading}>All lists</h2>
          )}
          <ul className={styles.listGrid}>
            {inactiveLists.map((list) => (
              <li key={list.id}>
                <EventCard
                  href={list.href}
                  name={list.name}
                  imagePath={list.imagePath}
                  description={list.description}
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
