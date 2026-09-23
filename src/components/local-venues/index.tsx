import Image from "next/image";
import Link from "next/link";
import Tag from "@/components/tag";
import type { LocalVenue } from "@/utils/get-local-venues";
import { formatShortDistance } from "@/utils/geo-distance";
import { getMovieUrl } from "@/utils/get-movie-url";
import {
  formatShowingTime,
  getDaysFromNow,
  LONDON_TIMEZONE,
  timestampToLondonDateString,
} from "@/utils/format-date";
import styles from "./local-venues.module.css";

export type LocalVenuesItem = LocalVenue;

interface LocalVenuesProps {
  locals: LocalVenuesItem[];
}

/** "Today", "Tomorrow", or the weekday — a local's next few are all this week. */
function formatDay(time: number): string {
  const days = getDaysFromNow(time, 1);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return new Date(time).toLocaleDateString("en-GB", {
    weekday: "short",
    timeZone: LONDON_TIMEZONE,
  });
}

/**
 * The reader's locals: each nearby venue with its next few screenings and the
 * film clubs it hosts. Answers "what's on at the places I'd actually go?"
 * without a click — the venue page is one link away for everything else.
 */
export default function LocalVenues({ locals }: LocalVenuesProps) {
  return (
    <ul className={styles.grid}>
      {locals.map(
        ({
          venue,
          distance,
          weekScreeningCount,
          nextScreenings,
          filmClubs,
        }) => {
          const venueParams = `venues=${encodeURIComponent(venue.id)}`;
          return (
            <li key={venue.id} className={styles.card}>
              <header className={styles.header}>
                <div className={styles.logo}>
                  {venue.imagePath ? (
                    <Image
                      src={venue.imagePath}
                      alt=""
                      width={40}
                      height={40}
                      className={styles.image}
                    />
                  ) : (
                    <span className={styles.initial} aria-hidden="true">
                      {venue.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className={styles.heading}>
                  <h3 className={styles.name}>
                    <Link href={venue.href}>{venue.name}</Link>
                  </h3>
                  <span className={styles.meta}>
                    <span className={styles.distance}>
                      {formatShortDistance(distance)}
                    </span>
                    {" · "}
                    {weekScreeningCount.toLocaleString("en-GB")} screenings this
                    week
                  </span>
                </div>
              </header>

              <p className={styles.label}>Next up</p>
              <ol className={styles.list}>
                {nextScreenings.map(({ movie, performance }, index) => {
                  const day = timestampToLondonDateString(performance.time);
                  return (
                    <li
                      key={`${performance.showingId}-${performance.time}-${index}`}
                      className={styles.entry}
                    >
                      <span className={styles.when}>
                        <span className={styles.day}>
                          {formatDay(performance.time)}
                        </span>{" "}
                        <time
                          dateTime={new Date(performance.time).toISOString()}
                        >
                          {formatShowingTime(performance.time)}
                        </time>
                      </span>
                      <Link
                        href={`${getMovieUrl(movie)}?${venueParams}&dateStart=${day}&dateEnd=${day}`}
                        className={styles.film}
                      >
                        {movie.title}
                      </Link>
                    </li>
                  );
                })}
              </ol>

              {filmClubs.length > 0 && (
                <div className={styles.clubs}>
                  <p className={styles.label}>Film clubs here</p>
                  <div className={styles.tags}>
                    {filmClubs.map((club) => (
                      <Tag
                        key={club.id}
                        href={club.href}
                        color="blue"
                        size="sm"
                      >
                        {club.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              <footer className={styles.footer}>
                <Link href={`/catalogue?base=all&${venueParams}`}>
                  All screenings
                </Link>
                <Link href={`${venue.href}/calendar`}>Calendar</Link>
              </footer>
            </li>
          );
        },
      )}
    </ul>
  );
}
