# CLAUDE.md

## Project Overview

Clusterflick is a static Next.js web application that aggregates film screenings
from 400+ London cinemas into a single searchable interface. It uses a data
pipeline from separate repos (`clusterflick/data-combined`,
`clusterflick/data-matched`) and outputs a fully static site deployed to GitHub
Pages at clusterflick.com.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Build static export to `/out/`
- `npm run lint` — TypeScript type check (`tsc --noEmit`) + ESLint
- `npm run format` — Prettier format all files
- `npm run storybook` — Start Storybook dev server on port 6006
- `npm run build-storybook` — Build Storybook (also used for Vitest story tests)
- `npm run fetch-calendar-data` — Download the latest `data-calendar` release into `/public/calendars/` (see Venue Calendars)
- `npm run fetch-london-stations` — Regenerate `src/data/london-stations.json` from TfL's open data (see Nearby Venues); commit the result
- `npm run smoke-test` — Run Playwright smoke tests against deployed site (clusterflick.com by default); override with `SITE_URL=http://localhost:3000 npm run smoke-test` after `npm run build && npm start`

## Architecture

- **Framework:** Next.js 16 with App Router, static export (`output: "export"`)
- **React 19** with Server Components for data fetching, `"use client"` for
  interactive components
- **State management:** React Context (CinemaDataProvider → FilterConfigProvider
  → GeolocationProvider)
- **Styling:** CSS Modules exclusively (no CSS-in-JS), `clsx` for conditional
  classes
- **Data:** Chunked JSON loaded from `/public/data/`, served with gzip compression.
  At build time `getStaticData()` loads it once per worker and every page shares
  the same object, as do `applyMatchers` results (memoised per dataset). Treat
  both as read-only — sort a copy, never the dataset's own arrays — or the
  change leaks into every page rendered after it
- **Performance:** react-virtuoso for the client-rendered films grid (see Film
  Lists on why server-rendered grids must not virtualise), data chunking,
  critical CSS extraction

## Project Structure

```
src/
  app/           — Next.js App Router pages (layout.tsx, page.tsx, dynamic routes)
  components/    — Reusable UI components (one per directory: index.tsx + .module.css)
  state/         — React Context providers (cinema-data, filter-config, geolocation)
  hooks/         — Custom React hooks
  data/          — Static data files (festivals registry, London boroughs)
  lib/           — Domain logic (filters/)
  utils/         — Utility functions (date formatting, data loading, geo distance)
  stories/       — Page-level Storybook stories
  types.ts       — Shared TypeScript types and enums
scripts/         — Node.js build-time data processing scripts
smoke-tests/     — Playwright E2E smoke tests
.storybook/      — Storybook configuration and MSW mocks
public/data/     — Static compressed cinema data files
```

## Component Design System

Before writing any UI code, check whether an existing shared component already
covers the need. The canonical components are:

- **Layout:** `StandardPageLayout`, `HeroSection`, `ContentSection`,
  `GroupHeader`, `Divider`, `CardGrid`
- **Navigation / links:** `LinkGrid` (multi-column scannable lists),
  `LinkedList` (single-column with optional detail + "show all"),
  `LinkCard` (rich card with icon/description)
- **Buttons:** `Button` (`<button>`), `ButtonLink` (internal `<Link>`),
  `ButtonAnchor` (external `<a>`)
- **Posters:** `FilmPosterGrid` (browsing grid, title on hover),
  `PosterTile` + `PosterTileList` (compact tile with title and detail below,
  plus an optional control)
- **Programmes:** `ProgrammeCard` (a festival, club or list with films
  showing: logo, a fan of posters, the next screening), `EventCard` (the same
  with nothing showing), `FestivalTimeline` (festivals as bars across the
  coming weeks)
- **Typography:** `OutlineHeading`, `Tag`
- **Form controls:** `Chip` (checkbox/radio), `Switch`
- **Feedback:** `EmptyState`

Only create a new component when no existing one fits. When you do:

1. Create `src/components/<name>/index.tsx` and
   `src/components/<name>/<name>.module.css`.
2. Add `src/components/<name>/<name>.stories.tsx` with `tags: ["autodocs"]`, a
   JSDoc block on `meta` explaining when to use / not use the component, and at
   least one story per meaningful variant. Set
   `parameters: { backgrounds: { default: "dark" } }`.
3. Export a named `<ComponentName>Item` type if the component accepts a list of
   data objects (see `LinkGrid`, `LinkedList`).

## Code Conventions

- **File naming:** kebab-case for files/directories, PascalCase for components
- **Components:** Each component lives in its own directory with `index.tsx`,
  `component-name.module.css`, and optional `.stories.tsx`
- **Imports:** Use `@/` path alias for `src/` imports (e.g.,
  `import { Button } from "@/components/button"`)
- **TypeScript:** Strict mode enabled; use interfaces for component props, enums
  for fixed categories (Category, AccessibilityFeature, Classification)
- **Functions:** `get*` for data retrieval, `format*` for string formatting,
  `fetch*` for async operations, `use*` for hooks
- **Exports:** Default exports for page components, named exports for utilities
  and shared functions
- **CSS:** Mobile-first responsive design with CSS Modules; variant mappings via
  `Record<Variant, string>` objects
- **Links:** Do not add custom CSS classes to plain `<a>` or `<Link>` elements
  just to replicate global link styles. The global stylesheet already styles
  links correctly — custom overrides are usually unnecessary and worse.

## Film Clubs

Film clubs are defined in `src/data/film-clubs.ts`. Each club has a `matchers` array of
`Partial<FilterState>` objects used to identify its showings in the combined dataset.

**Matcher semantics:**

- Matchers are **OR'd** — a movie matches if it satisfies any one matcher object
- Filter keys within a single matcher are **AND'd** — all keys must match simultaneously
- The OR is taken over **showings and performances, not movie ids** — see below

**Available matcher filter IDs** (use `FilterId.*` from `@/lib/filters/types`):

- `ShowingTitleSearch` — substring match on `showing.title` (falls back to `movie.title` when absent)
- `ShowingUrlSearch` — substring match on `showing.url`; internal-only (no UI, no URL params)
- `PerformanceNotesSearch` — substring match on `performance.notes`
- `Venues` — restrict to specific venue IDs (string array)

All of these filters prune at **showing level**: only matching showings (and their performances) are
returned. A movie screening at three venues will only surface the venue(s) whose showing matched —
not the full set. This is critical for correctness when a film screens at both a film club venue
and regular cinemas simultaneously.

Because each matcher returns the movie pruned to _its own_ matches, a film matching two matchers
arrives once per matcher, each copy carrying a different slice of the same film.
`unionMatches` (`@/lib/filters/match-any`, shared with festivals and the programme filters) therefore
unions those slices per movie; keeping the last copy silently drops the venues the earlier matchers found. The
Japanese Film Club is the case to keep in mind: the Phoenix lists "Shall We Dance?" under the club's
name and hands booking to the club, so its own listing is what we hold (the club's copy is
deduplicated away upstream) and only the _title_ matcher finds it — while the note matcher finds the
club-sourced showings at other venues.

`applyMatchers` (`@/lib/filters/apply-matchers`) is the page-side entry point: `matchAny` from the
manager, then finished performances pruned.

Each club also has a blurb component at `src/components/film-clubs/<id>.tsx` (default export +
named `seoDescription` string), and an optional logo at `public/images/film-clubs/<id>.*`.

Each club also has a `kind` (`FilmClubKind`), which files it under a heading on `/film-clubs`. Pick
the one a reader browsing for the club would look under first; a club that fits two goes where its
programme mostly sits (Queer Horror Nights is queer, Sick Girl Films is horror). The kind applies
whether or not the club has anything on: a dormant club is listed by name only, and moves into its
group as soon as a screening matches.

## Festival & Film Club Indexes

`/festivals` and `/film-clubs` lead with what's on, not who runs it. Both are
assembled in a util (`getFestivalsIndex`, `getFilmClubsIndex`) that the page
and its story share, with image paths and blurbs passed in since only the page
can read them from disk. Cards are `ProgrammeCard`s, whose posters, film count
and next screening come from `getProgrammeSummary`
(`@/utils/get-programme-summary`): films soonest first, those with poster art
ahead, the next screening skipping sold-out ones. `/lists` uses the same card
for lists with films showing, its posters in the list's own order.

**Film clubs** open with a "Next up" row: each club's next bookable screening,
soonest first (`getNextUpRow`). One per club, since a weekly club would
otherwise fill the row and the point is the range of what's on. The clubs
showing films follow, grouped by `kind` (`FILM_CLUB_KINDS` sets the headings
and their order; every club must have one, so a new club won't compile
without it) and sorted by next screening. Clubs with nothing on are a
`LinkGrid` of names, not cards that each say "No films currently showing".

**Festivals** open with a featured festival — the biggest with a screening in
the next seven days, else the next to start — with its films as a
`PosterRow` and the catalogue and planner links its own page has. Then a
`FestivalTimeline`, then "This week" and "Coming up" cards.

**"This week", not "on now".** The listings hold only what venues still
publish, so a festival's opening night drops out once it has passed and its
earliest listed screening is not its start. A festival's range is taken from
its unpruned matches (`matchAny`), which may still hold a screening from
earlier today, and the featured tag says "On now" only when it does; otherwise
"This week" or "Starts <date>".

## Film Lists

"Top films" lists (IMDb Top 250, Palme d'Or winners, …) live in `src/data/movie-lists/`, surfaced
at `/lists` and as "Appears on" pills on movie pages.

**What belongs here.** A list is a _named selection with a fixed membership_ — something a reader
could argue with by name. A threshold slid along a continuum is a filter, not a list: "highest
rated on Letterboxd" has no natural edge, so where you cut it is arbitrary. Those belong on the
films grid as a rating filter and sort. The 100% Club is the exception that proves it — computed,
but its boundary (a perfect score) is inherent rather than chosen.

**Two kinds:**

- **Curated** — reproduces someone else's published selection. Store only what identifies each
  film, in a `MovieListEntry[]` file, and always link back to the source.
- **Computed** — derived from rating data already in the dataset via a `score()` function, so it
  re-evaluates every build. Review-count floors come from `@/utils/movie-ratings.mjs`, shared with
  the Critics' Picks row.

**Matching** (`src/utils/get-movie-list-movies.ts`) resolves each entry in descending order of
certainty: `tmdbId` (the dataset keys movies by TMDB id, so this is a direct lookup) → `imdbId` →
`rtSlug` → title + year. Titles run through `getSearchVariants`, so roman numerals, ampersands and
punctuation all match; `altTitles` covers original-language titles. `yearTolerance` defaults to 1
and should be 2 for award lists, which cite the _award_ year — `La Strada` is a 1954 film that won
in 1956.

The index is built once per dataset and memoized in a `WeakMap`, because every movie page needs the
reverse lookup.

**Per list you can also set:**

- `filmBadge` — an emblem drawn on every poster (award lists only; a ranked list uses that slot for
  the position). Sized and inset per list, since a dense round mark needs more room than a thin
  silhouette.
- Logo at `public/images/movie-lists/<id>.*`, picked up automatically by id.

**Registry order is deliberate**: awards first, then lists from most selective to broadest. It sets
the order of the "Appears on" pills, which truncate after 4 on desktop — so the order decides what
a reader sees. It does _not_ affect the `/lists` index, which sorts by film count.

**Don't virtualise list pages.** `VirtualisedFilmGrid` is for the client-rendered films grid only;
Virtuoso renders no items during SSR without `initialItemCount`, which would leave the films out of
the static HTML. List pages use `FilmPosterGrid`, which lays out identically.

## Loading the Listings

`CinemaDataProvider` fetches the meta blob, then every movie chunk at once.
Each fetch goes through `fetchWithRetry` (`@/utils/fetch-with-retry`), the
client twin of the calendar script's: jittered exponential backoff under a
request timeout, the body parsed _inside_ the retried attempt (a truncated
response is the likely cause of bad JSON), and no retry on a 4xx other than
408/429.

**A chunk that still fails is a gap, not an error.** The rest load, and its
filename goes in `failedFiles`. Chunks are cut in title order, so a gap is a
run of titles that would otherwise read as simply not showing — which is why
`DataLoadNotice` (in the root layout) says the listings are incomplete, and
why `FilmPosterGridClient` stops pruning its static list while `failedFiles`
is non-empty. Anything else that reads a film's absence from `movies` as "not
showing" should check it too. The notice's Try again is `retryFailedFiles`,
which refetches only those chunks and merges them in without clearing the
page. Only a load where _nothing_ arrived sets `error`, the full-page state.

## Venue Calendars

`/venues/<slug>/calendar` renders the venue's published ICS feed in a month grid or agenda.

**The feed is consumed as published, not re-derived.** `clusterflick/data-calendar` releases one
ICS per venue, named after the venue id with no extension, one asset per venue in the dataset.
`scripts/fetch-calendar-data.js` downloads the latest release into `public/calendars/` as
`<venue-id>.<hash>.ics` plus a `manifest.json` of venue id → filename, which
`@/utils/get-venue-calendar` reads at build time so the hashed URL is baked into the static HTML.
Serving from our own origin removes CORS from the picture; the content hash means an unchanged
venue keeps its URL, and so its cache entry, between builds. A missing release is not fatal —
the manifest comes back empty and pages render their empty state.

**Network failure is expected; missing data is not.** Fetching hundreds of assets from GitHub's
CDN means the occasional dropped connection, and one of those used to fail the whole build. Every
request retries with jittered exponential backoff under a request timeout, and the body is read
_inside_ the retried attempt — a connection dropped mid-stream is the case worth retrying, and it
happens after the headers have arrived. A 4xx is not retried, being a permanent answer.

A download that still fails after all that **fails the build**. The tempting alternative — drop
that venue and carry on — is wrong here, because a venue absent from the manifest renders an empty
calendar, which tells a reader it has no screenings rather than that we failed to fetch them:
wrong information, not absent information. Deploys are triggered per data release, so a red build
costs one update and leaves the previous complete site standing, which is much cheaper than a
green build quietly shipping a partial set. This is the opposite call from a missing _release_
above, where every venue is equally empty and the site plainly has no calendar data at all.

Failures are still **collected rather than thrown at the first one**, even though any of them
fails the build. `Promise.all` rejects on the first rejection without cancelling its siblings, so
throwing from a worker exited the process mid-flight knowing nothing about the other 400 assets —
and skipped `writeManifest`, leaving a wiped directory and no manifest behind. Draining the queue
first means one log line distinguishes a single flaky venue from an outage.

The page then hands that URL to FullCalendar's `iCalendarPlugin` and never touches the bytes.
This is deliberate dogfooding: the page reads exactly what subscribers read, so anything wrong in
the feed shows up here. Events carry the film's page on this site as their `URL`, not a booking
link, so a click opens `/movies/<id>/<slug>` in a new tab. The feed builds that address itself,
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

## Near Me

Everything location-dependent on `/near-me` comes from one hook, `useNearMe`
(`src/hooks/use-near-me.ts`), computed on the client once the reader's position
is known; the page ships only build-time venue, club and festival counts.

**One nearby set feeds everything.** It is `getNearbyVenueIds`, the rule behind
the Nearby pill's Auto radius around the reader, plus the reader's locals. The page's rows,
map, cinema list and "What's on near me today" link all read that one set, so a
click never shows a different set of venues from the page it came from. The
locals are added in because the overlay's rule stops at ten venues, which in
Dalston is inside 0.6 miles, while a local can be up to two miles off. Without
them the today link skipped the Hackney Picturehouse the page had just named.

**Locals** (`getLocalVenues`) are the closest two venues within two miles with
_more than_ five bookable screenings in the next seven days, plus a third within
half a mile. A week rather than today, so a local does not vanish on a quiet
Monday. They count the default film categories, so the count agrees with the
today link, which carries only `venues`, `dateStart` and `dateEnd` and leaves
the rest at the catalogue defaults, the same state as the overlay's preset.

**The rows are the home page's rows, localised** (`computeNearMeRows`). Most
run over the listings pruned to the nearby venues, which makes "last chance"
mean the last _nearby_ showing. Occasions are the exception. They are scored
against the whole city and filtered afterwards, because rarity is a London-wide
question. "Showing Across London" and collections are left out, since both rank
breadth and breadth across a dozen venues says little.

**The map frames the venues and the reader, not the rings.** Framing the
two-mile ring left the nearest cinemas bunched in the middle of an empty circle.
Locals are drawn larger and outside the cluster group, so they never fold into a
bubble.

## Nearby Venues

The Venues section's **Nearby** pill picks the venues around a place, which
need not be where the reader is: a visitor plans from where they'll be. It
replaced "Venues Near Me", which knew only the device's position; the reader's
position is now one place among others ("Use my location").

**Places** (`@/lib/places`) are `here`, a `station:<slug>` or a `venue:<id>`.
Stations are the Underground, Overground, Elizabeth line and DLR, generated
from TfL's open data by `npm run fetch-london-stations` into
`src/data/london-stations.json` and committed, since a build shouldn't depend on
TfL's API. TfL's terms want their credit on the About page. The list is
imported dynamically, when the picker first shows. Boroughs are not places: a
borough is an area whose venues are decided by boundary, not a point, and its
page links to its venues already.

**The radius defaults to Auto**, Venues Near Me's rule (`getNearbyVenueIds`:
half a mile, widened until there are ten venues, up to two), which suits a
dense centre and a sparse suburb alike. ½, 1, 2 and 3 miles are the reader's
and never grow. A pick that finds nothing leaves the selection alone and says
so, keeping the place for a wider radius.

**What it produces is an ordinary venue selection**, so a URL carries venue ids
and nothing else. A separate filter holding the place was built first and
taken out: it put a second "near" control beside Venues, ANDed with it, for
the same operation Venues Near Me already did. **The place is remembered beside
the selection instead** (`VenueOrigin`: place, label, point, radius and the
venues it picked), per tab in session storage and never in a URL
(`venueOrigin` and `selectVenuesNear` on the filter context). While the
selection is still exactly those venues (`isVenueOriginCurrent`), the pill is
checked, the picker shows the place and radius, changing either picks again
without starting over, and descriptions read "Near King's Cross St. Pancras"
or "Within 2 miles of …" (`describeVenueOrigin`, passed to `describeFilters`
as `venueOrigin`). Once the reader changes the selection any other way it is
an ordinary selection again. A shared link reads as its venues ("At Camden
Town Hall or 110 more"), which is accepted. The "Near me today" preset
remembers its origin too (`here`, Auto), so it reads "Near you".

The point is stored with the origin, so a new radius needs no lookup and
`here` stays where the reader was when they picked it.

## Filter Overlay

`FilterOverlay` (`src/components/filter-overlay/`) is being reorganised in stages
around progressive disclosure: the most used filters in front, every filter
findable, and a filter that is set never hidden.

**Core filters and Refine.** Dates, Venues and Events are always in view:
Dates and Venues in the left column, Events at the top of the right one;
everything else is a Refine row below Events, one line each
naming the filter and what it is set to (`RefineRow`, `filter-targets.ts`):
Accessibility, Showings (hide past / sold out, moved out of the Dates
header), Format, Genre, Ratings, Directors & cast, Films, and Clubs &
festivals. Rows with an index page (formats, genres, clubs, festivals) link to
it at the top of the row.
Side by side so the Refine list starts on screen and opening a row can't push
the core down; one column below 1200px, in the same order. Events moved across
to balance the columns: with all three core filters on the left it ran ~500px
past Refine, and now the two end within ~130px. It sits above Refine rather
than below, since rows open downwards and some are taller than the screen —
below them, opening one would push a core filter out of view. Every name is readable
without opening anything, which is what makes a filter findable, and opening
one reveals one filter rather than the dozen "More Event Options" held.
Accessibility comes first: it is a requirement for those who use it.

**Rows open themselves** when their filter becomes set, on mount included, and
never close themselves — the old `expandWhen` rule, per row instead of for the
whole bucket. The overlay owns which rows are open, so the strip can open one.

**Row summaries are the strip's chip labels**, grouped by `FILTER_TARGETS` (a
`Record<FilterId, …>`, so a new filter won't compile until it has a place), so
a row and its chip can't describe a filter differently. Showings is worded on
its own, since its default has no chip.

**The search box also finds filters** (`FilterSearch`, matching in
`@/lib/filters/filter-search`). Typing still searches titles live; a menu
under it offers the filter values the query names — event types, genres,
formats, accessibility (with the suggestion engine's aliases, so "subs" finds
Subtitles), directors, cast, clubs, festivals and venues — plus the two other
text fields to search instead. Nothing is highlighted until the reader arrows
down, so Enter and typing mean what they always did. A pick toggles the value
into its filter and clears the box (the query was the value's name); picking
into a filter at everything or its default selects just that value, so
"Quizzes" means quizzes rather than films and quizzes. Downshift's blur-picks
and Escape-clears are overridden: this box is also the title search.

- **Venues are in, unlike the suggestion engine**: there a name colliding
  with a title would be read as the answer; here it is one candidate of
  several and the reader picks. **Films are out**: the box already searches
  titles, so a film row would offer the same thing twice.
- **Matching is per word**: the query's words must be a run of the name's
  words, the last one possibly a prefix ("alfred hitch", never "cock"). The
  last word is compared folded only when it ends in an inflection
  ("subtitled", "dramas"); folding a word still being typed made "mar" a whole
  match for Kenneth Mars.
- **Whole-word matches rank first**, then group order (enumerated
  vocabularies, directors, cast, clubs, festivals, venues), so "rio" lists Rio
  Cinema above Louise Rioton. Up to three per group, ten in all.
- **It runs off a sorted word index**, built in idle time when the overlay
  opens (`prepareFilterSearch`). Scanning the 13,000 names cost ~12ms a
  keystroke whatever was typed; the index answers in 0–3ms. Building it is
  ~175ms, which is why it's done before the first keystroke rather than on it,
  and only for readers who open the overlay.

**The counts bar is pinned** on desktop and tablet. It reaches up to the top of
the overlay and sticks at 0, carrying the room under the site header as its own
padding: a sticky element can't be pulled up into its container's padding with
a negative margin, which slid it down over the search box. Not pinned on a
phone, where under the trigger's wrapped description it took over half the
screen; there a "Show N events" button sticks to the bottom instead. The
overlay has no bottom padding on a phone, because sticky offsets are measured
from the scroll container's content edge and its 60px left the button
floating above the bottom of the screen.

The open trigger's description draws a dark box-shadow ~60px deep to stay
legible over what scrolls beneath it, and the header sits above the overlay,
so the shadow dims anything that close. Above 700px the pinned counts bar
already backs the description, so the trigger drops the shadow there and the
counts sit 24px under it; on a phone the bar scrolls away, the shadow stays,
and the counts keep a 66px gap. The trigger's media query is tied to the
overlay's 700px breakpoint.

**Presets are slim pills in the bar**: "Near me today" and "This week".
"Show everything" is the third preset, but as the way out of every filter it
sits beside Reset as a link.

**The active-filters strip** (`describeFilterChips` in `@/lib/filters/describe`)
lists every filter narrowing the results as a chip, driven by
`getRestrictiveFilterIds` so the restrictive defaults (date window, event
types) appear too, marked Default. Removing a chip widens its filters to
permissive (`widenFilters`), not back to the default, so removing "Next 7 Days"
shows every date. Hide finished showings is left out, being on in every visit
and hiding only what nobody can go to. A chip's label goes to its controls —
opening its Refine row, centring the row's trigger (not the row, which can be
taller than the screen and put its heading under the bar) and focusing it.

**Usage is tracked** to decide what belongs in front: `filter-preset`,
`filter-reset`, `filter-share`, `filter-chip-remove`, `filter-chip-open`,
`filter-row-open`, `filter-search-pick`, `filter-search-redirect`, and
`filter-overlay-close`
with the ids of the filters that visit changed (`getChangedFilterIds`), sent
once per visit rather than per tap. Filter ids only, never values.

## Cast & Crew Filters

Directors and cast are **filters on the films grid, not pages of their own**
(`src/lib/filters/modules/people.ts`, surfaced in the filter overlay's
`PeopleFilterSection`).

**Why no `/directors/<id>` pages.** Measured against a live release: 1,288
distinct directors, of whom **1,082 (84%) have exactly one film showing**. A page
each would be ~1,300 static pages that mostly reproduce a TMDB synopsis already
on the film's own page — thin content, and a meaningful share of a build that
already runs 20 minutes for ~3,600 pages. It is also the call `/lists` already
documents: "a threshold slid along a continuum is a filter, not a list", and
"directors with enough films on" re-cuts itself every week. The stale-page
problem that films need (`departed-movies.json`) therefore never arises here —
there is no page to 404.

**The data is already shipped.** `people` is 449KB of the 645KB meta blob every
visitor downloads, and `movie.directors` / `movie.actors` are already in the
chunks. Before these filters that payload existed only to render name pills. The
filters cost no additional bytes.

**`people` carries no role** — it is a flat `{ id, name }` map covering
directors and cast alike. `getPeopleVocabulary` folds `movie.directors` and
`movie.actors` to split them, and the fold doubles as the per-name film count.
Memoise it on the dataset; it is one pass over every film's credits.

**Empty means unfiltered, unlike genres.** Both store `string[] | null`, but
genres are an enumerated chip list where `[]` legitimately means "none selected,
nothing matches". People are a typeahead with no Select All, so `[]` is just what
removing the last name leaves behind — it is treated as no filter, and
`fromUrlParams` normalises it to `null` so an empty `?directors=` can never
report itself restrictive while filtering nothing.

**Names link from movie pages** (`CastCrewSection` → `getPersonFilterUrl`), which
is the only thing making the filters discoverable — nobody opens an overlay
looking for a filter they don't know exists. Links carry `base=all`, since the
today→+7d default would answer a director with one film three weeks out by
showing nothing.

**It is the "Directors & cast" Refine row** (see Filter Overlay), as two
`advancedFilterGroup`s in one row — cast and crew are one way to narrow an
event, not two. Those groups space their
own children, so `EntityQuickAdd` carries no margin of its own and each placing
section supplies it (`standaloneQuickAdd` for the venue one, which sits in a
section with no gap). Two CSS modules cannot override one another by class
order, so the margin has to live at one end or the other, not both.

**The row opens itself while a director or cast member is set**, as every
Refine row does: these arrive from outside the overlay (a name on a film
page), and behind a closed row they would read as no filter at all.

**The control is `EntityQuickAdd`**, the Downshift combobox the venue filter
already used, generalised. Matching is case-insensitive substring, and results
stop at `maxResults` **in list order** — so the vocabulary must arrive
best-represented first, or a two-letter query walks all 11,000 cast names.

**A menu falls back to fuzzy; it has nothing to disambiguate.** When the
substring pass finds nothing the query is re-read as a misspelling ("Mark
Hammill" is one letter from a real name and used to answer with an empty menu),
and the closest names are listed closest-first. Unlike the suggestion engine
there is no tier logic here: a menu _is_ a list of candidates, so several
matches is the normal outcome rather than a problem. Only on zero substring
matches, so the scan never runs while a normal search is being typed, and the
word-splitting is cached in a `WeakMap` on the list rather than done on mount —
most sessions never mistype anything.

**`buildPeopleIndex` is not optional at this size.** It maps every whole-word
run of every name to the people claiming it, keyed the way `normalizeForSearch`
renders a query — safe because `normalizeToWords(s).join("") ===
normalizeForSearch(s)`, so a lookup is exactly the whole-word-run comparison it
replaces. Scanning the names instead cost ~10ms of every suggestion pass once
cast was included (29ms → 39ms), paid whether or not anything matched, on the
deferred path that exists to keep typing responsive. Build it once per dataset
and memoise it beside the vocabulary.

**Popularity is a tie-break and nothing more.** `combine` publishes TheMovieDB's
`popularity` with each person and `rankPeoplePopularity` in
`scripts/process-combined-data.js` replaces it with a 0–99 percentile rank
before it reaches the client. A percentile rather than a rounded score because
popularity is heavily skewed — rounding puts almost everyone at 0 or 1, and the
ties this exists to break are mostly between two people at the obscure end. The
float would cost 274KB across the meta blob every visitor downloads; the rank
costs 91KB.

The underlying score is a rolling _trending_ measure recomputed daily from page
views, not standing, so it must never rank anything on its own — it only orders
two people a query could equally have named. `common/get-movie-data.js` uses it
the same way, behind an exact name match and the person's department.

**Every reader must cope without it.** A release published before the pipeline
started emitting it carries none, and TheMovieDB has no score for some people.
Absent is not zero — unranked, not unpopular — and the ordering falls through to
director-first.

## Films Filter

`FilterId.Movies` (`src/lib/filters/modules/movies.ts`) restricts the grid to a
chosen set of films by id. It is the people filters over again, keyed on the
film rather than a credit: `string[] | null`, "or" across the selection, empty
meaning no filter, a `?movies=` param, and an `EntityQuickAdd` in the "Films" Refine row (`MovieFilterSection`). Its main job is the watchlist
links on `/personalise`; the typeahead is for picking a few films to fit
around each other in the planner.

**The selection is a snapshot, and unknown ids are kept.** "Explore watchlist"
and "Plan watchlist" write every id on the list into the URL, not just the
films showing now. A link can be bookmarked or shared, and it outlives the
release it was made against — a film that has finished its run can come back,
and dropping its id would make the link quietly miss it when it does. So
nothing prunes the selection: not `fromUrlParams`, not sanitising session
storage. An unknown id matches nothing until its film returns. What the link
does _not_ follow is the list itself: films added after it was made aren't in
it, which is accepted — the button always builds a fresh one.

**Only what the dataset resolves is counted or named.** The overlay draws chips
for the films it can find and says "Plus 3 films not currently showing" for the
rest; `describeFilters` reads "from 12 selected films", or names up to two. It
takes the loaded dataset as its `movies` lookup, withheld until loading has
finished, so a selection isn't described as not showing while its films are
still arriving. Past six chips the selection collapses to a count, since a
watchlist would otherwise push every other filter off the screen.

It widens as "All films", beside the people: a selection left over from
another page is exactly the invisible blocker the empty state exists to name.

## Hide Seen Films

`FilterId.HideSeen` (`src/lib/filters/modules/hide-seen.ts`) takes the films on
the reader's Seen list off the grid. It is a "Hide films I've seen" switch at
the top of the filter overlay's core column, above Dates, shown only once a
signed-in reader's lists have loaded. It used to sit under the event types,
below everything, where it was easy to miss; a standing preference leads the
filters rather than belonging to any one of them.

**The state holds the ids, not a flag.** The pipeline is a pure function of the
dataset and the state, and it runs where the user context can't reach —
suggestion probes, the thin-result notice, the overlay's counts — so the Seen
ids ride in the state as `string[] | null`. A flag would also leave everything
memoised on the state blind to a film being marked seen. `SeenFilterSync`
(`src/state/seen-filter-sync.tsx`, rendered inside `UserProvider`, which is
nested in `FilterConfigProvider` so neither can read the other) keeps the ids
equal to the Seen list while it is on, and switches it off on sign out.

**It is personal** (`personal: true` on the module): never written to a URL,
since a shared link is for someone with a different list, and carried across
whole-state replacements that stand for a search — a followed link, a quick
filter — by `keepPersonalFilters`. Reset Filters still clears it.

**Film pages ignore it.** Opening a film you've seen means you came for it;
hiding every showing would answer with nothing. The page applies the filters
with `hideSeen` nulled and puts the reader's setting back on any suggestion it
applies. Suggestions on the grid widen it after every subject and before
accessibility — it is a standing preference, not part of the search.

## Film Club & Festival Filters

`FilterId.FilmClubs` and `FilterId.Festivals` (`src/lib/filters/modules/programmes.ts`) restrict
the grid to the showings of chosen clubs or festivals. They are how a club's programme reaches the
catalogue and planner, which otherwise had no way to express a set of OR'd matchers.

**The selection is registry ids, not film ids.** Each id's matchers are run when the filter is
applied, so a link follows the club as the listings change — next month's screenings appear with
no change to the link. A button selecting the club's current films would go stale the day after it
was made. Otherwise it is the films filter over again: `string[] | null`, "or" within the
selection, empty meaning no filter, duplicates dropped by `fromUrlParams`, and ids the registry no
longer holds kept (a festival leaving between editions is a film finishing its run) and matching
nothing meanwhile. `describeFilters` names only what the registry holds.

**Two filters, not one**, built from one factory as directors and cast are. A club recurs with no
end and a festival is a bounded event, and the rest of the site keeps them apart. As with the
people filters, a selection within one is "or" and the two together are "and" — a club's
screenings that are part of a festival.

**Matchers run through the pipeline itself**, over `getPermissiveState()`, so a club's filter means
exactly what its page shows. That makes the manager both the thing running the matchers and the
owner of the modules that call it, so `createMatchAny` takes the pipeline as an argument and the
two modules are built in `manager.ts` — importing the manager from a module would be a cycle.
Unlike `applyMatchers`, `matchAny` prunes nothing by time: inside the grid, finished showings are
the reader's hide-finished setting.

**They run first, and everything is memoised by record identity.** The grid re-runs the pipeline
on every keystroke, and the suggestion engine probes it dozens of times. Running first means they
always receive the dataset itself, which `matchAny` caches on; each filter also caches its union
per input record and (sorted) selection, so the festival filter, which receives the club filter's
output, sees the same record every pass and hits its own cache.

**Suggestions widen them last among the subjects**, after films: a club or festival is usually why
the reader is looking, and a monthly club outside the date window wants the dates widened, not
the club dropped.

**The registries ship to the client**, since the pipeline is synchronous and runs everywhere the
filter state does. Minified and gzipped they are ~4.5KB together; the blurb components stay
server-side.

**Where it surfaces:**

- **Club and festival pages** carry "Explore in the catalogue" and "Plan in the planner" under the
  hero title (`EventDetailPageContent`'s `browseLinks`), and point the grid's explore link at the
  filtered catalogue — as genre and format pages do. Both only while something is showing; a hero
  button onto an empty grid reads as broken. Links use `getProgrammeFilterUrl`, with `base=all` —
  clubs are often listed as events, which the default categories hide, and a monthly club shows
  nothing in most weeks' default window.
- **The overlay**, in the "Clubs & festivals" Refine row (`ProgrammeFilterSection`), one
  `EntityQuickAdd` per group. The row opens itself while either is set, as every Refine row does.

**No banner above the grid.** One was built and taken out: the trigger's description already names
the club ("Events from Japanese Film Club"), and the watchlist and people filters — also set from
another page, also deciding what the grid is about — have none. A banner for programmes alone would
be inconsistent. On a phone the description is what has to carry it, so there it fills the space
between the logo and the hamburger and runs to two lines at 14px — still inside the 40px trigger,
so the header keeps its height and the sticky bar under it doesn't move. One line at the old width
read "Events fro…" at 360px.

**The typeahead carries no counts.** Counting a programme means running its matchers over the
dataset, and each matcher pass is 3–6ms whatever the matcher: against a live release (2,193 films,
36,163 performances) counting all ~90 clubs and festivals took 1.4s, 1s with the search variants
already cached — far too long for opening an overlay, on a phone several times longer. The names
are listed alphabetically instead, and only the selected chips are counted, from the cache the
filter itself has just filled. `EntityQuickAdd`'s `count` is optional for this.

## Home Row "See All" Links

A home row is a slice: a rule, cut to its top dozen or so for a horizontal row. Where the rule can be
said as filters, the row's "See all" (`PosterRow`'s `seeAllHref`) opens the catalogue on **all** of
it, not a snapshot of the slice. They sit on the default base, because the catalogue's default week
and categories are the rows' own.

- **Highly Rated** → `/catalogue?letterboxd=4.0` (`getHighlyRatedUrl`). The row and the filter share
  one test, `meetsRating`, so the grid is exactly what the row is a slice of.
- **Marathons & Double Bills** → Multiple Films plus Short Films (`getMarathonsUrl`). A superset,
  knowingly: the row is multi-film events, and Short Films also holds single shorts (15 of 32 in a
  live week). No filter tells a shorts programme from one short, and the data can't reliably either
  — some programmes carry no list of their films — so a short on that page was accepted over a
  filter of its own.

The rest need filters that don't exist yet (last chance, just added), a sort (Showing Across
London), or a costlier probe (More Than a Screening). Lists and collections need no link: their
pages already show every member that is showing.

**The rating filters** (`src/lib/filters/modules/ratings.ts`) are three, one per source, built from
one factory as the people and format filters are: Letterboxd (`?letterboxd=`, out of 5), IMDb
(`?imdb=`, out of 10) and Rotten Tomatoes (`?rottenTomatoes=`, 0–100). Each is a minimum on a
`Slider` in the overlay's "Ratings" Refine row. They are not
one blended score, because the sources don't measure the same thing: Letterboxd and IMDb publish an
average, Rotten Tomatoes the share of critics who liked a film, and of 193 films carrying both a
Letterboxd average and a Tomatometer score, 73 fell on opposite sides of an 80% line.

- **Review floors are the site's existing ones** (`@/utils/movie-ratings.mjs`: 2,000 Letterboxd
  reviews, 10,000 IMDb votes, 40 critic reviews), read by `getLetterboxdRating`, `getImdbRating` and
  `getRottenTomatoesScore`. A film under the floor has no score, so any minimum excludes it, and a
  one-line note under each slider ("Only films with 2,000+ reviews are counted") says so, so an
  unrated film dropping out isn't read as a verdict on it.
- **Ranges cover where a threshold separates films**, not the whole scale: Letterboxd 3.0–4.5 and
  IMDb 6.0–9.0 in 0.1 steps, Rotten Tomatoes 60–100% in steps of 1. Scores bunch — Letterboxd
  between 3.5 and 4.3, Rotten Tomatoes between 85 and 98 — so coarser steps jump straight across
  the useful range. Each slider's lowest position, one step below its range, reads "Any rating" and
  clears it: a slider has no off switch, and a second control for one setting is worse.
- **Scores compare at the precision they're shown at**: a film averaging 3.96 reads "4.0/5", and
  "4.0+" leaving it out would contradict the poster.
- **"Highly rated" is set per source at roughly its top quarter**, measured on the films showing in
  one live week: Letterboxd 4.0+ (80 of 307, 26%), IMDb 8.0+ (45 of 191, 24%), Rotten Tomatoes 95%+
  (43 of 198, 22%). Not a shared fraction of each maximum: 80% matched the first two but let in 66%
  of Rotten Tomatoes' films, since well-known films with 40+ critic reviews are mostly well liked.

**Highly Rated is the Letterboxd filter at its line**, through the same `meetsRating`. Letterboxd
because it rates the most of what's showing (307 of 448 films that week). It used to be
`getRating`'s best available source normalised to 0–1, which the scales above rule out; `getRating`
had resolved to Letterboxd for 307 of 312 rated films anyway. It was renamed from Critics' Picks,
being audience averages, and **the heading names no source** (`HIGHLY_RATED` in
`get-discovery-movies.ts` picks it), so the source can change without it; the posters' subtitles name
it. It no longer drops "permanent fixtures" (30+ upcoming showings): meant for museum IMAX
attractions, that was catching wide re-releases like Coraline and Casino Royale. The editorial
summary still uses `getRating`, for its own "acclaimed gem" idea.

**Lists from a rating site link to its line** — "Browse all films highly rated on IMDb (8.0+)" on
the IMDb Top 250, the Letterboxd line on the Letterboxd Top 500, the Rotten Tomatoes line on its
lists — by the list's `source` (`RATING_FILTER_BY_SOURCE` on the list page). It's a wider net than
the list in the same terms, which is exploration the list page itself can't offer. `base=all`,
unlike the home row, since a list page shows every member whenever it's showing. It's shown even
when nothing from the list is on, when it's the most useful thing on the page. Editorial lists
(Oscars, Cannes, Empire…) have no scale to widen along, and no link.

## Thin-Result Notice

When a filtered grid returns a handful of films and widening the dates would
return meaningfully more, `getHiddenByDate` (`src/lib/filters/hidden-by-date.ts`)
says so in a quiet line under the grid, rendered by `HiddenResultsNotice`.

**Separate from the suggestion engine on purpose.** That exists to rescue a
search that returned nothing and is phrased that way throughout; this is the
opposite situation — the search worked, and the answer is merely narrower than
it looks. It is one probe rather than a pass, offers one widening rather than
ranking many, and reads as a fact rather than a rescue. An empty grid returns
null and belongs to the engine, which can pair the date with whatever else is
wrong where this only knows dates.

**Dates only.** The date window is the documented most-common invisible blocker
and the only one with a natural reading ("more showing later"). Anything else
would be a suggestion, which is the engine's job.

**`THIN_RESULT_LIMIT` is 3, and it almost never binds.** Across every person
filter in a live release, 71% show nothing at all, 27% show exactly one film and
under 1% show more than three; raising the limit to five moves the fire rate
from 20% to 21%. What it does do is keep the line off a grid that is genuinely
full — an unfiltered `/catalogue` shows 448 films with 1,382 more beyond the window.

**A film already on screen is never counted as hidden**, however many of its
showings fall outside the window: the reader can see it and click through.

**Shaped like a suggestion offer** — command, then the fact, then the count it
yields — because it is the same kind of thing to press. Quieter for the reason
above: no accent border, no list around it. It follows the same fortnight rule
for dates ("next in 9 days" inside it, "next on Sunday 27 December" beyond), via
`RELATIVE_DAY_LIMIT` in `format-date.ts`, which both this and the suggestion
engine now read.

**It needs a lead-in, for the same reason the empty state has a heading.** A
button on its own under a grid that looks finished has nothing saying why it is
there. "Expecting more results?" is a question rather than a heading, because
the films above it are a real answer and this only asks whether a longer one was
expected — a heading would announce a section and claim more of the page than
the notice is worth.

It probes the live filter state, not the deferred copy the suggestions use: it
is a single pass rather than thirty-odd probes, and a stale count under a grid
that has already moved on would be wrong rather than merely late.

## Zero-Result Suggestions

When a filtered grid comes up empty, `src/lib/filters/suggest.ts` finds the cheapest
changes that would return something, each with a real result count, rendered by
`FilterSuggestions` inside the `EmptyState`.

It works by **probing**: build a candidate state, run the real filter pipeline over it,
count what survives. The counts shown are therefore the counts the user will get — there is
no second implementation of the filter logic to drift out of sync.

**Five kinds of move:**

- **Filter value** — the query names a filter value rather than a film: "70mm" is a source
  format, "Action" is a genre. Keeps every word typed, so it ranks above everything. Matching
  is against **whole words, with folded endings and aliases** — never an edit budget. The
  words people actually type for a value are mostly not spellings of its label: "subs",
  "captioned" and "SDH" all mean Subtitles and no distance reaches any of them, so they are
  aliases (`ACCESSIBILITY_ALIASES`, `GENRE_ALIASES`, `CATEGORY_ALIASES` in `value-aliases.ts`,
  shared with the filter overlay's search menu).
  `foldSuffix` strips -s/-es/-ies/-ed from both sides, which covers "subtitle", "subtitled"
  and "dramas" without an entry. Matching a _run_ of words is what lets "70mm" find both
  "70mm" and "IMAX 70mm"; both are offered, each with its own probed count. Vocabularies are the format groups,
  genres, event types, accessibility features and **directors**. **Venues are deliberately
  excluded** — their names are full of ordinary words (Rio, Castle, Everyman) that collide
  with film titles. Genre metadata is keyed by id and the entries carry only a `name`, as
  `describeFilters` reads them. Unlike a correction this is _not_ gated on the query matching
  no title.

  **The same reading is offered on a grid that has results** (`getFilterValueOffers`),
  because the engine above only runs on an empty one and "horror" or "16mm" usually appears
  in a title or two. It is shown _above_ the grid — it is not limited to short grids, and
  under a long one nobody would reach it. The exception is when the thin-result notice is
  showing: the grid is then three films at most, so the offer sits beneath it, just above
  that notice. Either way it only appears when taking it returns more films than
  the grid already shows. A value already selected, and a format's default (Digital, Normal,
  2D), are never offered. People are left out: a name rarely matches a title, so the empty
  path already catches it.

  **People are resolved jointly, not as two vocabularies** (`resolvePeopleQuery`
  in `lib/filters/modules/people.ts`). A name is a far weaker signal than a
  format string: most of a people vocabulary is forenames held in common, so a
  fragment is read as a name only when it picks out one person per role.
  1. Unique in one role, ambiguous or absent in the other → that one. Measured
     502 fragments to 20 in the "unique director, ambiguous cast" direction,
     which is the point — unique among 1,288 directors is a far stronger claim
     than unique among 11,070 cast.
  2. Unique in both, names differ → **both**. They are two different people and
     only the reader knows which. Preferring the director was measured and is
     wrong 23 times in 212, on exactly the names people type: "pacino" is Al
     Pacino (6 films) far more often than Julie Pacino (1).
  3. Unique in both, names match → both, being one person in two roles answering
     for different films. Compared **by name, not id**: TheMovieDB carries
     duplicate person records, so John Carpenter directing and John Carpenter
     appearing can be two ids, and a reader cannot tell two identical names
     apart anyway.
  4. Ambiguous in both → nothing. "john" is 27 directors; a fragment naming 27
     people names none of them.

  **A miss falls through to fuzzy, and the tiers then read it unchanged.** When
  the exact index lookup finds nothing, `fuzzyMatch` returns everyone at the
  _closest_ edit distance and only them, and the four tiers above apply as
  written — one name is that person, two are two candidates, a crowd is nobody.
  Keeping the whole edit budget instead would hand them an average of seven
  names; the closest tier holds exactly one 42% of the time, and where it does,
  it is the right person **98%** of the time. Exact always wins first, so a
  correctly spelt name is never re-read as a near-miss of a different one, and
  fuzzy can only add offers where there were none.

  This is deliberately _not_ a "did you mean" correction like the title one
  below. The offer already names the person and carries a count, so there is
  nothing to ask: "hammill" simply offers **Show films starring Mark Hamill**.

  **Ordering within a pair**: films currently showing, then popularity, then
  director. Film count leads because it is what the offer accounts for — a
  twelve-film retrospective is the better answer to an ambiguous surname.
  Popularity settles the rest, which is most of them: of 212 pairs the counts
  are equal in 165. Director breaks what remains. This is not a breach of "order
  is editorial, never by count" below: that rule stops count overriding whether
  an offer is _actionable_ across kinds of move, and here both offers are the
  same kind and equally actionable — the only question is which person was
  meant.

  **A pair is never split.** The round-one cut gives way by one rather than take
  the first and drop the second, which would present a guess as the answer. It
  can only overflow by one, since a pair is two moves. Nothing else can push a
  pair to the boundary today: measured, **zero** of the 212 tier-2 and 259
  tier-3 fragments collide with the format, genre, event-type or accessibility
  vocabularies. The guard is for when that stops being true.

  A credit floor was tried first and was the wrong guard on every measured axis:
  at two credits it ruled out 1,082 of 1,288 directors — exactly the single-film
  ones with no other route to their film — and still left 46 contested
  fragments. Uniqueness reaches 1,285 and leaves none. The cost argument for a
  floor did not survive measurement either: the scan is ~0.3ms against a ~26ms
  pass, because the probes dominate.

- **Redirect** — the same query matched against a different search field (`Search` ↔
  `ShowingTitleSearch` ↔ `PerformanceNotesSearch`). Concedes nothing, so it outranks
  everything else. Only offered when the target field is empty. `ShowingUrlSearch` is
  excluded — internal-only, so it can neither be explained nor undone.
- **Clear a stale query** — when the film title box and the original venue title or
  performance note box are both filled, clearing the other box (the title query is kept).
  Every text field narrows independently, and the second one is usually left over — typed
  earlier, or put there by a redirect offer — when the reader goes back to search by title.
  No redirect can help, since the query has nowhere empty to go. It leads its offer (the
  reader must agree to losing words they typed) and names the films it brings back; ranks
  after corrections, before widens. The one place the grid drops a query rather than
  redirecting it.
- **Correct** — a near-miss film title replacing the query ("Did you mean …?"). Ranks below
  a redirect, because it rewrites what the reader asked for. Generated only when _no_ title
  matches the query, tested via `matchesSearchQuery` so a query that lands only through a
  spelling variant ("godfather part 2") still counts as correct. Only the main `Search` box
  is corrected: it is the only field drawn from a fixed vocabulary of titles.

  Matching compares the query against **runs of whole words** (`normalizeToWords`), scored by
  an optimal-string-alignment distance that treats an adjacent swap as one edit. Both halves
  are load-bearing and were learned the hard way:
  - _Word anchoring._ `normalizeForSearch` strips spaces, so a free-floating substring match
    scored "ornage" one edit from "short**s for age**s" — three words deep — and beat
    "A Clockwork Orange". People mistype words, not character windows.
  - _Transpositions._ Plain Levenshtein charges an adjacent swap as two substitutions, which
    priced "ornage"→"orange" and "bilss"→"bliss" out of any budget a short query can afford.

  `MIN_FUZZY_LENGTH` (in `word-distance.ts`, shared with the people lookup) is empirical,
  and 5 is a floor _and_ a ceiling: real cases
  ("akera"→Akira, "bilss"→Bliss) are five characters, so raising it loses them. Five-character
  queries stay speculative by nature — anything one edit from a title word draws an offer —
  which is why offers are phrased as a question and carry a count. Re-measure on live data
  before changing either the length floor or the budget formula.

- **Widen** — one filter reset to its permissive value, ordered by elasticity in
  `WIDENABLE`.

**Two moves that write the same filter are never combined.** Each move declares `writes`, and
a pair whose sets intersect is rejected. Transforms apply in order, so the second silently
undoes the first while both still appear in the copy — setting the event type to Quizzes and
then widening the event type to everything produced an offer headed "Show Quizzes" that
selected all events. This also covers the query fields, so a correction never pairs with a
redirect and a query never lands in two boxes at once.

**Candidates come from `getRestrictiveFilterIds`, not `getActiveFilterIds`.** Categories, the
date range and hide-finished have _restrictive_ defaults (Films/Multiple/Shorts, today→+7d,
finished showings hidden), so they report themselves inactive while still removing results — and
they are the most common invisible blockers. Anything comparing against defaults instead of
`getPermissiveState()` is blind to them.

**Every multi-select filter reads as "or".** They all match a film satisfying
_any_ selected value — two directors returns the films of either, not the films
they made together — so `formatList` takes a conjunction and each of them passes
"or": "directed by Ridley Scott or George Lucas and starring Mark Hamill".

**Order is editorial, never by count.** Sorting by result count would promote "drop your
Subtitles requirement" whenever it frees up the most screenings, which is the one suggestion a
subtitles user cannot act on. Accessibility ranks last and is never combined with another
move (`soloOnly`) — it is a requirement, not a preference. Search queries are redirected,
never dropped — except a stale second query beside a film title query, above.

**Rounds stop at two.** Redirects, then single widens, then pairs. A three-filter relaxation
is a reset with extra steps, so the caller offers a reset instead.

**Cost decides order, not visibility.** The search runs until it has `limit` offers — it does
_not_ stop at the first productive round. A redirect and a widening answer different questions
about different films ("wrong field" vs "filters too narrow"), so a cheap redirect must not
suppress an expensive pair. Searching "word" turns up a performance note straight away while
the film called "Words" sits outside the date window _and_ in an excluded category, reachable
only as a pair. The one thing skipped is a pair whose halves already work individually — that
is a more expensive route to results already listed.

**Each offer is a headline plus one line per filter it changes.**

- The **headline** must read as something you can do. A bare filter name ("Any date") reads as
  a caption, not a button, so a widening-only offer names the films it would reveal instead
  (`Show "A" & "B"`, `Show "A" & 29 more`). A move that rewrites the query — a correction or a
  redirect — leads instead, since that is the part the reader has to agree to.
- **Change lines** are `Label: detail`, where the detail comes from the move's `describeResult`
  against the probe result. One line each, never joined: joining produced
  `Did you mean "X"?, any date` — a comma after a question mark, with the second change buried
  at the end of the first.
- A move whose action is already the headline contributes only its detail, so nothing is said
  twice. A correction has no detail, so it drops out entirely — reporting a next-showing date
  under a correction implied the date window had moved when it had not. **The next-showing date
  belongs to the date widening alone.**
- Dates are relative inside a fortnight ("next showing in 8 days"), absolute beyond it, where
  counting is harder than reading.
- Naming categories and venues needs the `categories`/`venues` lookups passed in (same shape as
  `describeFilters`); without them offers degrade to bare counts rather than breaking.
  Accessibility has no detail by design, since any detail there argues for giving up a
  requirement.

**The engine checks its own precondition.** `suggestFilterRelaxations` returns `[]` when the
state it is handed already has results. The caller's idea of "empty" is easy to take from a
different state than the one passed in — see the deferred copy below — and one keystroke of
daylight was enough to offer improvements to a query that had results.

**When several corrections tie** (a one-edit query is routinely one edit from a dozen titles,
all through the same word), the sort breaks the tie by **reach**, then screening count, then
soonest showing. Alphabetical is the one ordering with nothing to recommend it; only two
corrections are ever offered, so the tie-break decides what the reader actually sees.

Reach (`correctionReach`) is how many filter changes the correction needs on top of the
rewrite: 0 if the current filters already show the film, 1 if one widening does. A candidate
needing more is dropped before the cut, since rounds stop at two and it could only ever be
probed and discarded. Ranking on screenings alone let "mark h" spend both slots on a festival
outside the date window and a talk no pair could reach, while "Sherman's March", showing
that week, was never looked at. Each check runs the pipeline over the one film, not the
dataset.

**On the films page** the empty state pulls up under the search controls whenever it carries
offers (`.emptyStateNearControls`) — centred in the viewport put them half a screen from the box
the query was typed into. Suggestions ride a `useDeferredValue` copy of the filter state so
typing stays responsive; React keeps the previous offers on screen while a pass catches up,
which is deliberate — blanking them flickered the empty state on every keypress.

### On a film page

When the filters hide every showing of the film being looked at, the showings
section's empty state carries offers from `suggestShowingRelaxations`, beside
the existing **Show all** button. It shares `findOffers` with the grid engine, so
ordering, the two-change limit, pair collisions and `soloOnly` accessibility
cannot drift between the two. What differs:

- **Only widenings.** Filter-value, people, redirect and correction moves all
  answer "your query named the wrong thing", and a film page's subject is fixed.
- **Queries are dropped, not redirected.** A search left over from the grid
  ("alien", "Q&A" in notes) can hide every showing of the film opened next, and
  nothing but a reset would otherwise say so. This is the one place a query is
  given up; it sits after the widenings and before accessibility.
- **Counts are showings.** In films every offer would read "1 result", and a
  widen headline would name the film already on screen — so the headline is the
  action itself ("Search all dates and search all venues").
- **Offers write the global filter state**, as on the grid. An offer is a filter
  change; "Show all" is the way to look past the filters without changing them.

It probes one film, so it runs on the live state rather than a deferred copy.

**"Playing at" counts the showings listed below it**, not the build-time
totals, so a venue the filters hide isn't named above a list with none of its
showings. The static HTML keeps the build-time counts until the listings load.
When narrowed it says "4 of 102 venues match your filters" with the showings'
own Show all beside it, so a venue missing from the list doesn't read as the
film not playing there. When the filters hide every showing it keeps the full
list: the empty state below explains, and an empty "Playing at" would hide
where the film is on.

## Personalisation

`/personalise` is where a reader signs in and manages their lists (watchlist,
seen). Accounts exist to hold those lists, and the page is framed around them
rather than around an account.

**Firebase, entirely client-side.** The site is a static export, so the browser
talks to Firebase Auth and Firestore directly and the Firestore security rules
(`firestore.rules`, deployed with the Firebase CLI via `firebase.json`) are the
only thing guarding the data. The `NEXT_PUBLIC_FIREBASE_*` web config is public
by design, set as repository _variables_ in `generate_site.yml`, and listed in
`.env.example` for local use. **When it is absent the feature switches itself
off** (`isFirebaseConfigured`, status `unavailable`), which is what keeps local
builds, Storybook, Chromatic and CI working without a project.

**Sign-up and sign-in are one action.** Email-link ("magic link") sign-in
creates the account the first time a link is redeemed, so there is no
registration page. The link returns to `/personalise/`, which redeems it. The
address must be supplied again to redeem it — the link deliberately doesn't
carry it, so an intercepted link is useless on its own — which is why it is
parked in `localStorage` (not `sessionStorage`: the link opens in a new tab),
deleted on use, and ignored after an hour. Opened in another browser, the page
asks for the address instead.

**Nobody pays for the SDK who doesn't use it.** `loadFirebase` dynamically
imports it, and the `UserProvider` (`@/state/user-context`) only calls it for a
visitor carrying the `clusterflick-signed-in` flag, or when sign-in starts. The
flag holds no personal data; if it outlives the session the SDK loads, reports
nobody and clears it. Keep every `firebase/*` import dynamic or type-only —
one static import puts the SDK in every page's bundle. Firestore is
`firebase/firestore/lite`: lists need neither realtime listeners nor offline
caching. Auth is `initializeAuth` rather than `getAuth`, which would bundle the
popup/redirect resolvers email links never use.

**Storage is one document per user at `users/{uid}`**, every list a map of
movie id → `UserListEntry`. One read per session. The entry snapshots title,
year and poster because a listed film outlives its run — once it leaves the
dataset and later its departed page, the snapshot is all there is. The id is
the same one the film's URL is built from, so it is stable across releases; the
slug is derived from the title, as `getMovieUrl` does. The rules restrict the
document to the list fields, so a new list needs a rules change too.

**Controls live under the poster on the film's page** (`UserListButtons`),
and under film search results, never on browsing-grid posters. Signed out, the
buttons link to `/personalise`, which makes them the way in to
personalisation. **Marking a film seen takes it off the
watchlist**, in the same write so the two can't disagree; the reverse doesn't
hold, since wanting to see a film again doesn't undo having seen it.

**Grid posters carry markers instead** (`PosterStatusMarkers`, in
`FilmPosterGrid` and `MovieCell`): small discs top-right for each list the film
is on — top-right because the rank chip holds top-left, award emblems
bottom-right, and the title overlay the bottom edge on touch. They cost nothing
extra: `UserProvider` sits in the root layout, so a signed-in reader's lists
are already loaded on every page. Statuses are independent (a film can be seen
and back on the watchlist), so markers stack like chips and fan out on hover;
a new status such as an alert is one more entry in its `MARKERS`. They render
only once signed in with lists loaded, so the static HTML is unchanged.

**The home page opens with "From Your Watchlist"** (`WatchlistRow`,
`getWatchlistRow`), above Showing Across London: watchlist films with a
bookable showing in the next fortnight — a fortnight, as for occasions, since a
watchlist is small and worth planning around. It is **ordered by favourite
venues, not filtered to them**: a handful of venues against a handful of films
usually intersect in nothing, and a one-poster row reads as broken. Films at a
favourite come first, soonest there first, subtitled with the venue and date;
then the rest, with the Last Chance row's "Last showing" when the run is ending
and "Next showing" otherwise. Every category counts, since the reader chose the
films. Hidden when empty and while signed out, so the static HTML is unchanged.

It arrives seconds after paint, above every other row, so its slot **reserves
the height the row last had**: an inline script sets it before paint, only for
a reader carrying the signed-in flag (which is why `SIGNED_IN_FLAG_KEY` lives
in `@/lib/user-lists`, readable from a server component, not in the user
context). The reservation comes off in a layout effect once the row settles,
which also stores the new height — or clears it when the row is empty, so a
reader with nothing showing reserves nothing next time.

**`/personalise` splits the watchlist into showing now and not showing**,
using the client cinema data, since what's on is the question a watchlist is
brought to. Films not showing are unlinked: whether a departed page still
exists is only known at build time. With nothing to follow up, they fold
behind an `ExpandableSection`, open from the start only when nothing on the
list is showing, so the watchlist never looks empty. **Seen is one list**,
showing or not: having seen a film is what matters, and a showing one still
reads as such by being linked. It opens cut to three rows
(`TruncatedTileList`, which counts columns from the measured lane width so
the cut is always whole rows) with a "Show all" button. Each group is sorted by normalised title,
as /catalogue and /planner are — the pipeline's `normalizedTitle` for a film
still in the dataset, the same folding applied to the snapshot's title for one
that has left it. Films are `PosterTile`s, as on /updates, so the title reads
under the poster and the Remove button sits beneath it, outside the tile's
link — the pill the film page's list buttons use, pink on hover. Signed in, the page renders in `StandardPageLayout`'s
`afterContent` rather than the 1000px column, which fits only four posters
across, and aligns to the poster columns as `/planner` does.

**The watchlist says what's time-sensitive** (`getWatchlistHighlights`), in
two groups above Showing now, each soonest first:

- **Last chance** — the last bookable showing is within the home page's Last
  Chance window. The definition is shared, so a film can't be ending on one
  page and not the other.
- **More than a screening** — an upcoming occasion (a Q&A, a live score). This
  is the home row's scoring with no end date: scored over the whole dataset
  (house style is judged per venue) and then filtered to the watchlist, so
  what the home row wouldn't call rare isn't flagged here either. Sold-out
  occasions are skipped.

A film can be in both, and each group then says its own thing about it; either
takes it out of Showing now. The why goes in a `PosterTile` `note` — a small box
above Remove, with a label ("Final showing", "Q&A with Mike Leigh") and a
plain day and time ("Tomorrow, 20:30") with the venue on a line of its own,
which truncates rather than wraps so a long name can't make one note taller
than its row. Final
showing is yellow, the colour of the planner's "Last chance" tag, so the two
read as the same warning; occasions keep the pink. It sits
at the foot of the tile rather than among the details, where it pushed that
tile's title out of line with the rest of the row.

The two groups **share a row while they fit**. Each is a flex item whose
basis is the width its own tiles need. When both fit they sit side by side (8
films beside 2 fits a 12-poster width) and split the leftover space equally, so
a lone group fills the row and two equal ones go 50/50. A group too long to
share wraps onto a row of its own. Each has a floor at the width of the longest
heading, since a wrapped heading drops its lane out of line with its
neighbour's, and the lanes stretch so neighbours end on the same line.

**Tiles are the same size in every group.** PosterTileList's tracks stretch to
fill whatever width they're given, so a group taking a share of the row would
size its tiles differently from its neighbour and from Showing now. The groups
instead get fixed tracks at `--tile`, the width a full-width list produces,
computed from the measured row width (`useElementWidth`,
`getFullWidthTileWidth`). The space a group grows into stays empty at the end of
its lane.

**Removing offers an undo in place** (`RemovedPosterTile`). The removal is
written straight away — closing the tab never loses it — and the page holds the
entry locally so its tile keeps its place, with **Undo** where **Remove** was.
Undo writes the entry back as it was (`restoreToList`: original `addedAt`, and
none of `addToList`'s side effects, which for Seen would take the film off the
watchlist). The countdown is a 3s CSS animation whose end is the expiry. It
does **not** pause on hover: the pointer is on Undo the moment the tile
appears, so hover-pausing held it open until the reader moved away. It pauses
on keyboard focus only, because focus is moved to Undo and expiring underneath
it would drop a keyboard reader back to the top of the page.

**The account bar is a toolbar**: "Manage lists" and "Manage account" on the
left, each opening a panel below it (one at a time), and who's signed in with
Sign out on the right. "Manage account" holds the What we store note and Delete
account; signed out, the note is a footnote under the sign-in form instead.

**List tools sit behind "Manage lists"**, collapsed by default, since
everything in them is occasional (`list-management.tsx`).
Editing takes a row of its own first, import and export pair up below it, and
"Add a film" (below) comes last, as the one part whose results grow:

- **Show Remove buttons** — off by default, and per visit rather than stored:
  a Remove under every poster reads as the page's main business.
- **Import from Letterboxd.** Reads Letterboxd's export files (`watchlist.csv`,
  `watched.csv`, `diary.csv` — `Name`, `Year`, a date) and its import format
  (`Title`, `Year`, `tmdbID`), parsed in `@/lib/user-lists/letterboxd-csv`. The
  reader picks the target list; the file's contents can't tell a watchlist from
  a watched list. Letterboxd's URI is a boxd.it short link with nothing to
  match on, and its own export carries no TMDB id, so films are found by title
  and year in two passes:
  1. **The dataset**, with `createMovieMatcher` (`@/utils/match-movie`), the
     same resolver the film lists use, pulled out of `get-movie-list-movies` so
     the page doesn't bundle every list's entries.
  2. **TheMovieDB, for the rest**, through the search Worker's batch endpoint
     (`lookUpRowsOnTmdb`, `@/lib/user-lists/tmdb-lookup`). Rows are grouped by
     folded title and year first, so a diary's rewatches are one lookup, and a
     row already on the list by title and year isn't looked up just to be
     skipped. Batches of 15 (what the Worker fits in Workers Free's 50
     subrequests) go one every 60s / 13, the Worker's per-reader limit, so a
     2,000-film diary takes about 10 minutes; the page shows progress and can
     cancel. Matching is strict — a title that matches, or the only result for
     that year — and a film it can't find is listed in the review for the
     reader to search for, never guessed. A 429 is waited out; any other
     failure is retried twice and then **fails the whole import**, since
     counting a film that couldn't be looked up as missing would drop it
     without the reader knowing.

  A review step shows what will be added before anything is written: how many
  are showing (linked to their pages in a new tab, since the review is only
  page state and navigating away would lose it), the rest unlinked, and the
  films TMDB couldn't find. Films already listed keep their entry, and an
  import to Seen takes films off the watchlist, as a single add does — in one
  write (`addManyToUserList`). All of a reader's lists live in one Firestore
  document, so a very large import (several thousand films) could hit its
  1 MiB or 40,000-index-entry limits; excluding the list fields from indexing
  is the fix if anyone does.

- **Export** writes each list in Letterboxd's _import_ format rather than its
  export format: the `tmdbID` column makes it an exact match both in Letterboxd
  and back in here. A pipeline-generated id isn't TheMovieDB's, so it's left
  out and Letterboxd falls back to title and year.

**Any film can be added, showing or not** ("Add a film", `film-search.tsx`),
by searching TheMovieDB in the list tools. It sits there rather than at the top
of the page because the usual way to add a film is from its own page; the empty
watchlist points to it. The site can't call TMDB itself — the
key would ship to every browser — so the search goes through a Cloudflare
Worker, [clusterflick/api-tmdb-search](https://github.com/clusterflick/api-tmdb-search),
on `clusterflick.com/api/tmdb/*` in front of the static site. It answers only
signed-in readers: `@/lib/tmdb-search` sends the Firebase ID token
(`getIdToken` on the user context), refreshes it and retries once on a 401, and
reports a 429 rather than retrying. The Worker's results already have a list
entry's shape, keyed by TMDB id — the same id a matched film has here — so a
result that is showing is the dataset's film (linked, and added as its page
would add it) and the rest are added from TMDB's snapshot. It searches on
submit, not as the reader types: they're after a title they already know, the
answer is a grid rather than a menu, and every request counts against the
Worker's per-reader rate limit. TMDB asks for attribution in an About or Credits section, not beside
its results, so the About page's covers this. `next dev` rewrites
`/api/tmdb/*` to the Worker's `wrangler dev` on port 8787; a static export can
have no rewrites, so the build leaves them out.

**The watchlist opens on the grid.** "Explore watchlist" and "Plan watchlist"
beside its heading link to `/catalogue` and `/planner` with the films filter
set to every film on the list (`getMoviesFilterUrl`, with `base=all` so the
default week doesn't hide most of it). See Films Filter for why it carries
films that aren't showing. The helper is imported from its module rather than
the filters barrel, which would bundle the whole engine into this page.

**Venues can be starred into "My Venues"** (`FavouriteVenueButton` in a venue
page's hero), which the filter overlay offers as a Venues pill beside Nearby.
They are kept in a `favouriteVenues` field of the same document, not as a
`UserListId`: those are films, and markers, import, export and the watchlist
links all assume it. Each entry snapshots the venue's name, since a venue can
leave the dataset; like the films filter, a departed venue's id is kept in case
it returns. The pill selects only the favourites the dataset knows, so its
count is what the reader gets and a selection made from it matches it again.
It is hidden while signed out or with none known, and it is checked before the
other presets, so a favourite set that happens to equal one still reads as
My Venues. `/personalise` lists them between the watchlist and Seen as `VenueCard`s, with the
same Remove toggle, and "See on a map" opens the film page's `VenueMapDialog`
over the ones the dataset still knows. Empty, it offers the venue indexes (`/venues`, `/near-me`,
`/london-cinemas`, `/cinema-groups`) as the empty watchlist offers places to
find films.

**Empty lists** (`EmptyList`) sit in the same lane panel the full ones do, each
with its own neon icon (ticket, projector, 3D glasses). The button that fills
a list is named in yellow with the icon it carries on the site
(`ControlName`), so the reader knows it when they see it. The empty
watchlist's "Manage lists" opens the list tools and focuses the film search.
The empty My Venues links to `/catalogue#open-filters`, which opens the filter
overlay on arrival (`useOpenFiltersHash`, on /catalogue and /planner) — the My
Venues pill lives there and no page describes it better. The hook must run
before `applyUrlParams`, which replaces the whole address, hash included. The page is client-rendered and can't know which venues it
will show, so its server component passes every logo path in
(`getVenueImagePaths`), as `/near-me` passes its venues.

**Personalisation is account-only**, lists and venues alike, so that it syncs
across devices. Don't add a signed-out, browser-held copy of any of it.

**Deleting an account deletes the lists first**: once the account is gone, the
rules let nobody delete its document. Firebase may refuse the account deletion
without a recent sign-in; the lists are gone by then and the page says how to
finish.

## Testing

- **Storybook + Vitest:** Component tests run via `@storybook/addon-vitest` with
  Playwright browser provider (headless Chromium)
- **Playwright:** E2E smoke tests in `smoke-tests/` targeting the deployed site
  (configurable via `SITE_URL` env var)
- **Chromatic:** Visual regression testing via CI integration
- **Accessibility:** `@storybook/addon-a11y` for automated a11y audits on
  stories

## CI/CD

- **CI (ci.yml):** Runs on push/PR to main — lints, downloads data from release
  assets, processes data, builds Storybook, publishes to Chromatic, builds
  static site
- **Deploy (generate_site.yml):** Triggered by manual dispatch or data release
  events — builds and deploys to GitHub Pages, then runs smoke tests
- **Node version:** 24.13.0 (from `.node-version`)

## Communication

- If the user's intent is unclear, ask for clarification rather than guessing.
