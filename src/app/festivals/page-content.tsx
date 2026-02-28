import Link from "next/link";
import EventCard from "@/components/event-card";
import StandardPageLayout from "@/components/standard-page-layout";
import EmptyState from "@/components/empty-state";
import { CalendarIcon } from "@/components/icons";
import { formatDateShort } from "@/utils/format-date";
import type { FestivalListItem } from "./page";
import styles from "./page.module.css";

interface FestivalsPageContentProps {
  festivals: FestivalListItem[];
  venues: { name: string; href: string }[];
}

export default function FestivalsPageContent({
  festivals,
  venues,
}: FestivalsPageContentProps) {
  const count = festivals.length;

  const subtitle =
    count === 0
      ? "No festivals currently running"
      : `${count} ${count === 1 ? "festival" : "festivals"} running`;

  return (
    <StandardPageLayout
      title="Festivals"
      subtitle={subtitle}
      backUrl="/"
      backText="Back to film list"
    >
      {count > 0 && (
        <p className={styles.intro}>
          Clusterflick tracks film festivals happening right now across London.
          {venues.length > 0 && (
            <>
              {" "}
              Current festivals are screening at{" "}
              {venues.map((venue, i) => (
                <span key={venue.href}>
                  <Link href={venue.href}>{venue.name}</Link>
                  {i < venues.length - 2
                    ? ", "
                    : i === venues.length - 2
                      ? " and "
                      : ""}
                </span>
              ))}
              .
            </>
          )}
        </p>
      )}
      {festivals.length === 0 ? (
        <EmptyState
          icon={{
            src: "/images/icons/neon-ticket-ripped.svg",
            width: 120,
            height: 80,
          }}
          message="No festivals currently showing"
          hint="Check back soon — festival listings are updated regularly"
        />
      ) : (
        <ul className={styles.festivalGrid}>
          {festivals.map((festival) => (
            <li key={festival.id}>
              <EventCard
                href={festival.href}
                name={festival.name}
                imagePath={festival.imagePath}
                description={festival.seoDescription}
                meta={
                  <>
                    {festival.dateFrom !== null && festival.dateTo !== null && (
                      <span className={styles.metaItem}>
                        <CalendarIcon size={14} />
                        {formatDateShort(new Date(festival.dateFrom), {
                          includeYearIfDifferent: true,
                        })}
                        {new Date(festival.dateFrom).toDateString() !==
                          new Date(festival.dateTo).toDateString() && (
                          <>
                            {" "}
                            &ndash;{" "}
                            {formatDateShort(new Date(festival.dateTo), {
                              includeYearIfDifferent: true,
                            })}
                          </>
                        )}
                      </span>
                    )}
                    <span className={styles.metaItem}>
                      <span className={styles.filmCount}>
                        {festival.movieCount}{" "}
                        {festival.movieCount === 1 ? "film" : "films"}
                      </span>
                    </span>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </StandardPageLayout>
  );
}
