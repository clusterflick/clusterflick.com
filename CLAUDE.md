# CLAUDE.md

## Project Overview

Clusterflick is a static Next.js web application that aggregates film screenings
from 300+ London cinemas into a single searchable interface. It uses a data
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
- `npm run smoke-test` — Run Playwright smoke tests against deployed site (clusterflick.com by default); override with `SITE_URL=http://localhost:3000 npm run smoke-test` after `npm run build && npm start`

## Architecture

- **Framework:** Next.js 16 with App Router, static export (`output: "export"`)
- **React 19** with Server Components for data fetching, `"use client"` for
  interactive components
- **State management:** React Context (CinemaDataProvider → FilterConfigProvider
  → GeolocationProvider)
- **Styling:** CSS Modules exclusively (no CSS-in-JS), `clsx` for conditional
  classes
- **Data:** Chunked JSON loaded from `/public/data/`, served with gzip compression
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

**Available matcher filter IDs** (use `FilterId.*` from `@/lib/filters/types`):

- `ShowingTitleSearch` — substring match on `showing.title` (falls back to `movie.title` when absent)
- `ShowingUrlSearch` — substring match on `showing.url`; internal-only (no UI, no URL params)
- `PerformanceNotesSearch` — substring match on `performance.notes`
- `Venues` — restrict to specific venue IDs (string array)

All of these filters prune at **showing level**: only matching showings (and their performances) are
returned. A movie screening at three venues will only surface the venue(s) whose showing matched —
not the full set. This is critical for correctness when a film screens at both a film club venue
and regular cinemas simultaneously.

Each club also has a blurb component at `src/components/film-clubs/<id>.tsx` (default export +
named `seoDescription` string), and an optional logo at `public/images/film-clubs/<id>.*`.

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

The page then hands that URL to FullCalendar's `iCalendarPlugin` and never touches the bytes.
This is deliberate dogfooding: the page reads exactly what subscribers read, so anything wrong in
the feed shows up here. Events carry the venue's website as their `URL`, not a booking link, so a
click opens the venue site in a new tab — a feed-side limitation, not a page-side choice.

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

## Zero-Result Suggestions

When a filtered grid comes up empty, `src/lib/filters/suggest.ts` finds the cheapest
changes that would return something, each with a real result count, rendered by
`FilterSuggestions` inside the `EmptyState`.

It works by **probing**: build a candidate state, run the real filter pipeline over it,
count what survives. The counts shown are therefore the counts the user will get — there is
no second implementation of the filter logic to drift out of sync.

**Four kinds of move:**

- **Filter value** — the query names a filter value rather than a film: "70mm" is a source
  format, "Action" is a genre. Keeps every word typed, so it ranks above everything. Matching
  is **exact against whole words** (`bestWordRunDistance(…, 0)`), never fuzzy — over a small
  vocabulary an edit budget multiplies ambiguity for nothing ("Action" is a genre, "Acton" is
  a place). Matching a _run_ of words is what lets "70mm" find both "70mm" and "IMAX 70mm";
  both are offered, each with its own probed count. Vocabularies are the format groups,
  genres, event types and accessibility features. **Venues are deliberately excluded** — their
  names are full of ordinary words (Rio, Castle, Everyman) that collide with film titles.
  Genre metadata is keyed by id and the entries carry only a `name`, as `describeFilters`
  reads them. Unlike a correction this is _not_ gated on the query matching no title.
- **Redirect** — the same query matched against a different search field (`Search` ↔
  `ShowingTitleSearch` ↔ `PerformanceNotesSearch`). Concedes nothing, so it outranks
  everything else. Only offered when the target field is empty. `ShowingUrlSearch` is
  excluded — internal-only, so it can neither be explained nor undone.
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

  `MIN_CORRECTABLE_LENGTH` is empirical, and 5 is a floor _and_ a ceiling: real cases
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

**Candidates come from `getRestrictiveFilterIds`, not `getActiveFilterIds`.** Categories and
the date range have _restrictive_ defaults (Films/Multiple/Shorts, today→+7d), so they report
themselves inactive while still removing results — and they are the most common invisible
blockers. Anything comparing against defaults instead of `getPermissiveState()` is blind to both.

**Order is editorial, never by count.** Sorting by result count would promote "drop your
Subtitles requirement" whenever it frees up the most screenings, which is the one suggestion a
subtitles user cannot act on. Accessibility ranks last and is never combined with another
move (`soloOnly`) — it is a requirement, not a preference. Search queries are redirected,
never dropped.

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
all through the same word), the sort breaks the tie by screening count and then soonest
showing. Alphabetical is the one ordering with nothing to recommend it; only two corrections
are ever offered, so the tie-break decides what the reader actually sees.

**On the films page** the empty state pulls up under the search controls whenever it carries
offers (`.emptyStateNearControls`) — centred in the viewport put them half a screen from the box
the query was typed into. Suggestions ride a `useDeferredValue` copy of the filter state so
typing stays responsive; React keeps the previous offers on screen while a pass catches up,
which is deliberate — blanking them flickered the empty state on every keypress.

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
