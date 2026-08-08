"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import iCalendarPlugin from "@fullcalendar/icalendar";
import type { EventClickArg, EventMountArg } from "@fullcalendar/core";
import styles from "./calendar.module.css";

interface CalendarViewProps {
  /** Content-hashed, same-origin URL of the venue's ICS feed. */
  calendarPath: string;
  venueName: string;
}

// Below this width the month grid can't fit a night's programme into a cell, so
// the agenda is the only readable option.
const NARROW_VIEWPORT = "(max-width: 720px)";

export default function CalendarView({
  calendarPath,
  venueName,
}: CalendarViewProps) {
  // This component only ever renders in the browser (it is loaded with
  // ssr: false), so reading the viewport during the first render is safe and
  // avoids a flash of the wrong view.
  const [initialView] = useState(() =>
    window.matchMedia(NARROW_VIEWPORT).matches ? "listWeek" : "dayGridMonth",
  );
  const [hasError, setHasError] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // FullCalendar identifies an event source by object identity: hand it a fresh
  // literal and it drops the parsed feed and fetches again. Any re-render of
  // this component would then refetch, re-render, and loop — with the events
  // blanking on every cycle.
  const eventSource = useMemo(
    () => ({ url: calendarPath, format: "ics" as const }),
    [calendarPath],
  );

  // Keep the view in step with the viewport when it crosses the breakpoint —
  // rotating a phone into landscape should not leave you on an agenda that no
  // longer suits the space, and vice versa.
  useEffect(() => {
    const query = window.matchMedia(NARROW_VIEWPORT);
    const onChange = (event: MediaQueryListEvent) => {
      calendarRef.current
        ?.getApi()
        .changeView(event.matches ? "listWeek" : "dayGridMonth");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Events carry the venue's own website as their URL. Rather than navigating
  // the calendar away, open it in a new tab so the page you were reading stays
  // where it was.
  const onEventClick = (info: EventClickArg) => {
    info.jsEvent.preventDefault();
    if (info.event.url) {
      window.open(info.event.url, "_blank", "noopener,noreferrer");
    }
  };

  // Titles are truncated to one line in the month grid, so the full one goes on
  // a native tooltip. Set on the mounted element rather than through
  // `eventContent`: FullCalendar 6 renders its own content with Preact, and
  // React 19 JSX handed to that hook comes back empty.
  const onEventMount = (info: EventMountArg) => {
    info.el.title = info.event.title;
  };

  return (
    <div className={styles.calendar}>
      {hasError && (
        <p className={styles.error} role="status">
          The calendar for {venueName} could not be loaded. Please try again
          later.
        </p>
      )}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, listPlugin, iCalendarPlugin]}
        initialView={initialView}
        // Consumed exactly as published — the ICS is fetched and parsed by
        // FullCalendar, so this page reads the same feed our subscribers do.
        events={eventSource}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,listWeek",
        }}
        buttonText={{ today: "Today", month: "Month", list: "Agenda" }}
        // A busy multiplex programmes dozens of showings a day; without a cap a
        // single cell would swallow the grid. `true` caps at whatever the row
        // height actually fits, so a taller viewport shows more rather than
        // leaving an arbitrary number of slots empty.
        dayMaxEvents
        firstDay={1}
        // A 21:30 screening that runs to 00:30 ends on the following date, and
        // by default that puts it in both day cells. A late finish belongs to
        // the evening it started, so an event only reaches the next day if it
        // is still running at 09:00 — which no screening is.
        nextDayThreshold="09:00:00"
        // Render every event as a dot and title, never as a spanning bar. An
        // all-nighter is still technically multi-day, and would otherwise be
        // drawn as a filled block that looks like a different kind of thing.
        eventDisplay="list-item"
        // The feed publishes UTC instants, and FullCalendar's default "local"
        // zone renders them in the reader's own time — correct in London
        // without shipping a timezone plugin, and honest anywhere else. A named
        // zone here would need @fullcalendar/moment-timezone to work at all.
        locale="en-GB"
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        // Fills the wrapper, which the stylesheet floors at the viewport height.
        height="100%"
        stickyHeaderDates
        noEventsText="No showings listed in this period"
        eventDidMount={onEventMount}
        eventClick={onEventClick}
        eventSourceFailure={() => setHasError(true)}
      />
    </div>
  );
}
