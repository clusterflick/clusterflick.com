# Venue Calendars

`/venues/<slug>/calendar` renders the venue's published ICS feed in a month grid or agenda.

**The feed is consumed as published, not re-derived.** `clusterflick/data-calendar` releases one
ICS per venue, named after the venue id with no extension, one asset per venue in the dataset.
`scripts/fetch-published-data.js` hosts it at `/datasets/calendars/<venue-id>.ics` (see
Published Data), and `@/utils/get-venue-calendar` reads `datasets/index.json` at build time to know which
venues have one. The page loads that same URL: the address a subscriber's calendar app polls,
not a copy made for the page. Serving from our own origin removes CORS from the picture. A
missing release is not fatal — the index comes back empty and pages render their empty state.

**Network failure is expected; missing data is not.** Fetching hundreds of assets from GitHub's
CDN means the occasional dropped connection, and one of those used to fail the whole build. Every
request retries with jittered exponential backoff under a request timeout, and the body is read
_inside_ the retried attempt — a connection dropped mid-stream is the case worth retrying, and it
happens after the headers have arrived. A 4xx is not retried, being a permanent answer.

A download that still fails after all that **fails the build**. The tempting alternative — drop
that venue and carry on — is wrong here, because a venue absent from the index renders an empty
calendar, which tells a reader it has no screenings rather than that we failed to fetch them:
wrong information, not absent information. Deploys are triggered per data release, so a red build
costs one update and leaves the previous complete site standing, which is much cheaper than a
green build quietly shipping a partial set. This is the opposite call from a missing _release_
above, where every venue is equally empty and the site plainly has no calendar data at all.

Failures are still **collected rather than thrown at the first one**, even though any of them
fails the build. `Promise.all` rejects on the first rejection without cancelling its siblings, so
throwing from a worker exited the process mid-flight knowing nothing about the other 400 assets —
and skipped writing the index, leaving a wiped directory and no index behind. Draining the queue
first means one log line distinguishes a single flaky venue from an outage.

The page then hands that URL to FullCalendar's `iCalendarPlugin` and never touches the bytes.
This is deliberate dogfooding: the page reads exactly what subscribers read, so anything wrong in
the feed shows up here. Events carry the film's page on this site as their `URL`, not a booking
link, so a click opens `/movies/<id>/<slug>` in a new tab. The page adds the filters for that
screening (`getScreeningFilterUrl`: `base=all`, the venue, the screening's London day), so the
film opens on the showing that was clicked rather than every showing across London; `base=all`
because the default event types would hide a quiz or talk. The feed keeps the bare address —
filters are this site's behaviour, not the published data's — and the new tab's `noopener`
gives it its own session storage, so the reader's filters in the calendar's tab are left alone.
The feed builds that address itself,
from the same combined release the site builds from — it has to agree with `getMovieUrl` exactly,
since a static export has no dynamic route to catch a near-miss.

**Three things about FullCalendar 6 that are load-bearing:**

- **The event source must be a stable object.** FullCalendar identifies a source by object
  identity, so an inline `events={{ url, format }}` literal makes every re-render drop the parsed
  feed and refetch. With a `loading` callback that sets state, that is an infinite loop whose
  visible symptom is events flickering in and vanishing. It is memoized on `calendarPath`.
- **Custom content hooks render empty under React 19.** `eventContent` returning JSX produces
  blank events — FullCalendar 6 renders internally with Preact and its React connector predates
  React 19. Use FullCalendar's own default content and style it through `.fc-*` classes;
  where a DOM-level touch is needed (the title tooltip), `eventDidMount` works because it hands
  over a real element.
- **Named time zones need a plugin.** Only `local` and `UTC` work without one. The feed publishes
  UTC instants and the default `local` renders them correctly for London readers, so there is no
  reason to set `timeZone` at all.

The library is client-only (`ssr: false` via a client wrapper, since a Server Component may not
set that) and pulls in ~300KB, so it stays on this route. That leaves the page with no crawlable
content, and what it shows already exists on the venue page — hence `noindex` with a canonical
pointing at the venue page, and no entry in `sitemap.ts`.

The calendar goes in `StandardPageLayout`'s `afterContent` slot, not `children`, so it spans the
window rather than the 1000px content column — the page is one calendar and reads like a desktop
calendar app. The wrapper is floored at `100vh` and passes a definite height down a short flex
chain, which is what lets FullCalendar's `height="100%"` resolve; it is a floor rather than a fixed
height so a tall month can still grow. `dayMaxEvents` is `true` rather than a number so each cell
shows as many screenings as the row actually fits. The empty state stays in `children`, where the
narrower column suits it.

**Late screenings belong to the evening they started.** A 21:30 film ending at 00:30 has an end
date on the following day, so by default it is drawn in both day cells — and, being technically
multi-day, as a filled bar rather than a dot. `nextDayThreshold="09:00:00"` keeps it in the start
day alone (no screening is still running at 09:00), and `eventDisplay="list-item"` renders every
event as a dot and title so an all-nighter never looks like a different kind of thing.

Styling lives in `calendar.module.css` as `--fc-*` custom properties plus `:global(.fc-…)`
overrides. Two site-wide rules must be neutralised explicitly: events are `<a>` elements and pick
up the global blue link colour and underline, and the toolbar title is an `<h2>`, which globals.css
would render at 48px in pink.
