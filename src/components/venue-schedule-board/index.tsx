import Link from "next/link";
import {
  AccessibilityFeature,
  FormatSourceDefault,
  FormatDimensionDefault,
  type MoviePerformance,
} from "@/types";
import type { VenueScheduleDay } from "@/utils/get-venue-schedule";
import {
  formatShowingTime,
  formatDateShort,
  timestampToLondonDateString,
} from "@/utils/format-date";
import { getMovieUrl } from "@/utils/get-movie-url";
import { FORMAT_LABELS } from "@/utils/format-labels";
import { ACCESSIBILITY_LABELS } from "@/utils/accessibility-labels";
import styles from "./venue-schedule-board.module.css";

export type { VenueScheduleDay } from "@/utils/get-venue-schedule";

interface VenueScheduleBoardProps {
  /** Today and tomorrow, in order (from `getVenueSchedule`). */
  days: VenueScheduleDay[];
  /** Link to the full, filterable schedule for the venue. */
  seeAllHref: string;
  /**
   * Query string (without `?`) appended to each film link so the film page opens
   * scoped to this venue — otherwise the board's "The Invite" would open every
   * venue's performances, not just this one's.
   */
  movieUrlParams?: string;
}

/** Short badges for a performance's non-default format and accessibility. */
function getPerformanceMarkers(performance: MoviePerformance): string[] {
  const markers: string[] = [];
  const format = performance.format;
  if (format?.source && format.source !== FormatSourceDefault) {
    markers.push(FORMAT_LABELS[format.source]);
  }
  if (format?.presentation) {
    markers.push(FORMAT_LABELS[format.presentation]);
  }
  if (format?.dimension && format.dimension !== FormatDimensionDefault) {
    markers.push(FORMAT_LABELS[format.dimension]);
  }
  for (const feature of Object.values(AccessibilityFeature)) {
    if (performance.accessibility?.[feature]) {
      markers.push(ACCESSIBILITY_LABELS[feature]);
    }
  }
  return markers;
}

/**
 * A plain-text "on now" board for a single venue — the next 48
 * hours (today and tomorrow), grouped by day and listed by start time, in the
 * spirit of the schedule screens in a cinema lobby. Renders a graceful empty
 * state when nothing is scheduled. Server-only (no client hooks).
 */
export default function VenueScheduleBoard({
  days,
  seeAllHref,
  movieUrlParams,
}: VenueScheduleBoardProps) {
  const getQuery = (additioanal = "") =>
    movieUrlParams ? `?${movieUrlParams}${additioanal}` : "";
  const hasAny = days.some((day) => day.entries.length > 0);

  if (!hasAny) {
    return (
      <p className={styles.empty}>
        Nothing scheduled today or tomorrow —{" "}
        <Link href={seeAllHref}>see the full schedule</Link>.
      </p>
    );
  }

  return (
    <div className={styles.board}>
      {days.map((day) => (
        <section key={day.label} className={styles.day}>
          <h3 className={styles.dayHeading}>
            <span className={styles.dayLabel}>{day.label}</span>
            <span className={styles.dayDate}>
              {formatDateShort(new Date(day.date))}
            </span>
          </h3>
          {day.entries.length === 0 ? (
            <p className={styles.dayEmpty}>Nothing scheduled</p>
          ) : (
            <ol className={styles.list}>
              {day.entries.map(({ movie, performance }, index) => {
                const markers = getPerformanceMarkers(performance);
                const soldOut = performance.status?.soldOut;
                return (
                  <li
                    key={`${performance.showingId}-${performance.time}-${index}`}
                    className={styles.entry}
                  >
                    <time
                      className={styles.time}
                      dateTime={new Date(performance.time).toISOString()}
                      data-time={performance.time}
                    >
                      {formatShowingTime(performance.time)}
                    </time>
                    <span className={styles.details}>
                      <Link
                        href={`${getMovieUrl(movie)}${getQuery(`&dateStart=${timestampToLondonDateString(performance.time)}&dateEnd=${timestampToLondonDateString(performance.time)}`)}`}
                        className={styles.filmLink}
                      >
                        {movie.title}
                      </Link>
                      {markers.length > 0 && (
                        <span className={styles.markers}>
                          {markers.map((marker) => (
                            <span key={marker} className={styles.marker}>
                              {marker}
                            </span>
                          ))}
                        </span>
                      )}
                      {soldOut && (
                        <span className={styles.soldOut}>Sold out</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}
