"use client";

import dynamic from "next/dynamic";
import styles from "./calendar.module.css";

/**
 * FullCalendar reaches for the DOM as it mounts and pulls in ~300KB of parser
 * and view code, so it is loaded in the browser only. The route is a static
 * export; keeping it out of the prerender is what stops the build touching it.
 */
const CalendarView = dynamic(() => import("./calendar-view"), {
  ssr: false,
  loading: () => (
    <div className={styles.placeholder} role="status">
      Loading calendar&hellip;
    </div>
  ),
});

interface VenueCalendarProps {
  calendarPath: string;
  venueName: string;
}

export default function VenueCalendar({
  calendarPath,
  venueName,
}: VenueCalendarProps) {
  return <CalendarView calendarPath={calendarPath} venueName={venueName} />;
}
