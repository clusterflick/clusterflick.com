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
`applyMatchers` (`@/lib/filters/apply-matchers`, shared with festivals) therefore unions those
slices per movie; keeping the last copy silently drops the venues the earlier matchers found. The
Japanese Film Club is the case to keep in mind: the Phoenix lists "Shall We Dance?" under the club's
name and hands booking to the club, so its own listing is what we hold (the club's copy is
deduplicated away upstream) and only the _title_ matcher finds it — while the note matcher finds the
club-sourced showings at other venues.

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

**It sits inside "More Event Options", above Genre**, as two
`advancedFilterGroup`s rather than a section of its own — cast and crew are
another way to narrow an event, not a separate idea. Those groups space their
own children, so `EntityQuickAdd` carries no margin of its own and each placing
section supplies it (`standaloneQuickAdd` for the venue one, which sits in a
section with no gap). Two CSS modules cannot override one another by class
order, so the margin has to live at one end or the other, not both.

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

**Four kinds of move:**

- **Filter value** — the query names a filter value rather than a film: "70mm" is a source
  format, "Action" is a genre. Keeps every word typed, so it ranks above everything. Matching
  is against **whole words, with folded endings and aliases** — never an edit budget. The
  words people actually type for a value are mostly not spellings of its label: "subs",
  "captioned" and "SDH" all mean Subtitles and no distance reaches any of them, so they are
  aliases (`ACCESSIBILITY_ALIASES`, `GENRE_ALIASES`, `CATEGORY_ALIASES` in `suggest.ts`).
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

**Controls live on the film's page only** (`UserListButtons`), never on
posters: marking every grid would mean loading the SDK on every page for a
signed-in reader. Signed out, the buttons link to `/personalise`, which makes
them the way in to personalisation. **Marking a film seen takes it off the
watchlist**, in the same write so the two can't disagree; the reverse doesn't
hold, since wanting to see a film again doesn't undo having seen it.

**`/personalise` splits each list into showing now and not showing**, using
the client cinema data, since what's on is the question a watchlist is
brought to. Films not showing are drawn `unavailable` and unlinked: whether a
departed page still exists is only known at build time. Each poster carries a
Remove button through `FilmPosterGrid`'s `action` slot, which sits outside the
poster's link.

**Lists are account-only for now**, but the data layer takes a `UserListId`
and a movie snapshot and knows nothing about where they're kept, so
signed-out, browser-held lists that merge on sign-in remain an option.

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
