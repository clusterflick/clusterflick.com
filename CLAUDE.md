# CLAUDE.md

## Project Overview

Clusterflick is a static Next.js web application that aggregates film screenings
from 450+ London venues into a single searchable interface. It uses a data
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
- `npm run fetch-published-data` — Download the latest `data-transformed` and `data-calendar` releases into `/public/datasets/` (see Published Data)
- `npm run fetch-release-log` — Download every month of `data-analysed`'s release log into `/release-log/`, for `/datasets/status` (see Data Status)
- `npm run add-movie-list-tmdb-ids` — Give curated movie list entries their TMDB ids (see Film Lists); a dry run unless given `-- --write`; review the diff and commit it
- `npm run migrate-film-details` — One-off: give every listed film its details in Firestore (see `docs/personalisation.md`); a dry run unless given `-- --write`
- `npm run grant-capability -- <email> <capability>` — Grant a reader a capability (see Capabilities in `docs/personalisation.md`); `--revoke` takes it away, and it's a dry run unless given `--write`
- `npm run test:rules` — Test `firestore.rules` against the Firestore emulator (see Public Profiles in `docs/personalisation.md`); needs Java (a JDK 21, e.g. `brew install openjdk@21` on its `PATH`)
- `npm run fetch-london-stations` — Regenerate `packages/catalogue/src/data/london-stations.json` from TfL's open data (see Nearby Venues); commit the result
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

## The Catalogue Package

`packages/catalogue` is `@clusterflick/catalogue`, an npm workspace in this
repo: what the listings are and how they're searched, shared with the Workers
that need them (the MCP server, and saved-search alerts after it). It holds the
data model (`types.ts`), the filters, places, the occasion rules, the festival
and film-club registries, the stations, and the London-time date helpers.

**What goes in:** code about the listings that something outside the site needs.
Anything only the site uses stays in `src/`, even when it's about the listings
(`@/lib/occasions`' rarity finding, the page helpers). A reader's account is a
different concern: `@clusterflick/accounts`, below.

**The site uses the source.** `@clusterflick/catalogue/*` resolves to
`packages/catalogue/src/*` through `tsconfig.json`'s `paths` (Next, Storybook,
`tsc`) and an alias in `vitest.config.ts`, so a change to the package shows on
the site straight away and is tested by `npm test` like any other file; there's
nothing to build or publish first. The package's tests sit beside its code as
before. Import it by its subpaths, as the site always imported the files:
`@clusterflick/catalogue/filters`, `…/types`, `…/utils/format-date`.

**The package can't import the site.** Inside it, imports are relative. It
has no React and no `window`: its published declarations are built against
the web standards a browser, Node and a Worker share, so `window`, `document`
or `process` fails `npm run check -w @clusterflick/catalogue`, which CI runs.
That's why `buildFilterUrl` takes the page's address rather than reading it.

**Publishing** is for the Workers, which install it from npm. `npm run build -w
@clusterflick/catalogue` writes `dist/` (a module per source file, with type
declarations) and `check` imports every subpath of it in Node; neither is
needed for the site. A release is a version bump in its `package.json`:
`publish-catalogue.yml` publishes any version npm doesn't have yet, with
npm's trusted publishing, and skips every other push. See
`packages/catalogue/README.md`.

**The listings' shape is a contract with the Workers.** They read the
published `data/` (the MCP server does), from a deploy of their own, so a
change to `MetaData` or `Movie` reaches them only when they move to a new
version of the package. `DATA_FORMAT_VERSION` in
`packages/catalogue/src/data-format.mjs` is written into the meta file and
into `data/current.json`, the one file there with a fixed name, which names
the current meta file for a reader that can't list the directory. Raise it,
with a major version of the package, when a change would break a reader built
against the old shape (a field removed, renamed or changed in meaning); a new
optional field doesn't. A Worker refuses a version it wasn't built for.

## The Accounts Package

`packages/accounts` is `@clusterflick/accounts`, a second workspace built and
published as the catalogue is (`publish-accounts.yml`): a reader's account as
a Worker reads it. Firebase ID token checks, a service account's access token,
Firestore over REST, the lists decoded, and capabilities. The Workers that act
for a reader install it from npm (`api-profiles`, `api-tmdb-search`,
`api-mcp`, `api-alerts`, `api-letterboxd`).

Its `lists` module decodes the same documents as
`src/lib/user-profile/page-data.ts`, with the same rules: change the two
together. Its `capability-ids.mjs` is the one list of capability ids: the
site's `CapabilityId` re-exports it, and `scripts/lib/capabilities.js`
requires it from source, so a new capability is added there and nowhere else
(the site then needs its copy in `CAPABILITIES`). Its `alerts` module is the shape of a
reader's email alerts and of the alerts Worker's ledger, which the site and
the Worker both parse; `firestore.rules` repeats the settings' shape, held to
it by `firestore-rules/rules-copy.test.ts`. It writes (`commit`, with
preconditions) and finds documents by a field across a collection group, for
the alerts Worker; a field queried that way needs a `COLLECTION_GROUP` index in
`firestore.indexes.json`. Its `list-writes` module holds the list invariants a
Worker must keep when it adds films (details with every film, a listed film's
entry kept, stored entries never lost), first used by the Letterboxd sync
Worker; change it with `@/lib/user-lists` and the two stay alike.
See `packages/accounts/README.md`.

## Project Structure

```
src/
  app/           — Next.js App Router pages (layout.tsx, page.tsx, dynamic routes)
  components/    — Reusable UI components (one per directory: index.tsx + .module.css)
  state/         — React Context providers (cinema-data, filter-config, geolocation)
  hooks/         — Custom React hooks
  data/          — Static data files (London boroughs, movie lists)
  lib/           — Site-only domain logic (occasion finding, Firebase, lists)
  utils/         — Utility functions (data loading, page helpers)
  stories/       — Page-level Storybook stories
packages/
  catalogue/     — @clusterflick/catalogue: the data model (types.ts), filters,
                   places, occasion rules, festivals and film clubs, London
                   dates — see The Catalogue Package
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
  plus an optional control), `PosterStack` (a long tile list closed to a pile
  of posters that deals out into it)
- **Home page:** `FeatureCarousel` (a few films rotating full-width),
  `PickCard` (a film picked for a reason, with when and where), `StatsBand`
  (large linked figures that count up), `OccasionRow` (wide cards leading
  with what makes a screening an occasion)
- **Programmes:** `ProgrammeCard` (a festival, club or list with films
  showing: logo, a fan of posters, the next screening), `EventCard` (the same
  with nothing showing), `FestivalTimeline` (festivals as bars across the
  coming weeks)
- **Maps & charts:** `VenueMap` (venues as points, Leaflet), `BoroughMap`
  (boroughs shaded by a figure, static SVG), `RankedBarChart` (bars as a
  table, largest first)
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

## Page Widths

A page's content sits in one of four columns, tokens on `:root` in
`globals.css`, gutter included. **Pick by what the page mostly holds**, not by
which page you copied:

- **`--page-prose` (800px)** — reading pages: the data licence, the bot page,
  the changelog, the datasets pages. Long lines are hard to read, so this is
  one 800px column — until the screen has room for more (a 1040px container,
  about a 1080px window). Then the column widens to `--page-wide` and each
  section's heading moves into a rail beside its text, sticking under the
  header as the text scrolls. An 800px strip in the middle of a big screen
  left most of it empty and made the page longer than it needed to be; the
  rail uses the width while keeping the text column a readable length.
  `ContentSection` and the changelog's days take the rail (the `prose`
  container query, with `--prose-rail` and `--prose-gap` set by
  `StandardPageLayout`), and anything else lines up with the text column. A
  new block on a prose page that has a heading of its own should take the
  rail the same way.
- **`--page-default` (1000px)** — cards and lists: venues, festivals, clubs,
  boroughs, groups, a venue or programme page. The default.
- **`--page-wide` (1200px)** — poster rows and discovery: the home page. The
  footer sits at this width on every page.
- **`--page-film` (1400px)** — the film page alone, whose 308px poster column
  comes out of the width; at `--page-wide` the details beside it felt cramped.
- **Full-bleed** — poster grids, maps and calendars, through
  `StandardPageLayout`'s `afterContent`.

`StandardPageLayout` takes the first three as `width` (`"prose"`,
`"default"`, `"wide"`), so a page that wants a different column passes a prop
rather than rebuilding the header, hero and divider around a `.content` of its
own. A bespoke hero goes in `hero`.

Opening content that should centre on the page — a status line, the links to
sibling pages — goes in `lead`. It renders above the body at the prose text
measure, centred on the whole column, so on a prose page it stays out of the
heading rail instead of sitting off to the right in the text column, and it
ends 60px above the body, the gap between sections. `/datasets` and
`/datasets/status` use it.

Narrower elements inside a page share two measures (content only, so add any
gutter on top): **`--measure-blurb` (640px)** for hero taglines and blurbs,
and **`--measure-notice` (700px)** for the notices and offers under the
catalogue's search controls. A paragraph inside a card caps itself in `ch`
instead, since its measure belongs to its font size.

Anything lining up with a column reads its token (`calc(var(--page-default) -
40px)` for a bar that supplies its own gutter) rather than repeating the
number. Media queries can't read custom properties, so a breakpoint tied to a
width says which one beside it. The filter overlay's 1440px is not a page
width: it is sized for its two filter columns.

## Film Clubs

Film clubs are defined in `packages/catalogue/src/data/film-clubs.ts`. Each club has a `matchers` array of
`Partial<FilterState>` objects used to identify its showings in the combined dataset.

**Matcher semantics:**

- Matchers are **OR'd** — a movie matches if it satisfies any one matcher object
- Filter keys within a single matcher are **AND'd** — all keys must match simultaneously
- The OR is taken over **showings and performances, not movie ids** — see below

**Available matcher filter IDs** (use `FilterId.*` from `@clusterflick/catalogue/filters/types`):

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
`unionMatches` (`@clusterflick/catalogue/filters/match-any`, shared with festivals and the programme filters) therefore
unions those slices per movie; keeping the last copy silently drops the venues the earlier matchers found. The
Japanese Film Club is the case to keep in mind: the Phoenix lists "Shall We Dance?" under the club's
name and hands booking to the club, so its own listing is what we hold (the club's copy is
deduplicated away upstream) and only the _title_ matcher finds it — while the note matcher finds the
club-sourced showings at other venues.

`applyMatchers` (`@clusterflick/catalogue/filters/apply-matchers`) is the page-side entry point: `matchAny` from the
manager, then finished performances pruned.

Each club also has a blurb component at `src/components/film-clubs/<id>.tsx` (default export +
named `seoDescription` string), and an optional logo at `public/images/film-clubs/<id>.*`.

Each club also has a `kind` (`FilmClubKind`), which files it under a heading on `/film-clubs`. Pick
the one a reader browsing for the club would look under first; a club that fits two goes where its
programme mostly sits (Queer Horror Nights is queer, Sick Girl Films is horror). The kind applies
whether or not the club has anything on: a dormant club is listed by name only, and moves into its
group as soon as a screening matches.

## Home Page Top

The home page opens with three things built from data the build already has:
a `FeatureCarousel` of up to four films, the `h1` over a `StatsBand` of the
week's scale, and "This Week's Picks" as `PickCard`s, with the summary's prose
folded beneath them. The discovery rows follow, except that "Sagas & Series"
is left out with fewer than `COLLECTION_ROW_MIN` (2) collections, applied in
`computeDiscoveryRows` so the build-time rows and the client's agree: a row of
one collection reads as broken.

The lead and the summary are dense with names, so their text is muted grey and
their links bold light grey with a faint underline rather than the global blue,
which made them read as a page of references. They still turn pink on hover.

**Two rows have a layout of their own**, the two whose point a poster can't
show. The rest stay poster rows, which scan easily once the top of the page
carries the variety.

- **More Than a Screening** is an `OccasionRow`: wide cards that lead with the
  occasion ("Live score by …") in large type, the film beneath, the poster
  blurred behind as a wash. They lead with the occasion rather than a label so
  they don't read as more picks. `getOccasionMovies` carries the `occasion`
  (label, time, venue id), and `getOccasionRowItems` turns it into cards for
  both this row and `/near-me`'s, which differ only in where a card leads: the
  home page opens the film on its full schedule, `/near-me` on its nearby
  showings.
  What counts as an occasion is the pipeline's call: it reads each venue's
  listing, title, notes and description and publishes
  `performance.occasions` (`intro`, `qAndA`, `liveScore`, `premiere`, …, each
  `true` or carrying `guests`, `performers` or a `region`). The description is
  why it lives there - the ICA's "The Eel" says nothing in its title, while its
  page names who introduces it. `matchOccasions` (`@clusterflick/catalogue/occasions/rules`)
  only turns that into this site's kinds and labels; how rare an occasion is,
  which decides the row, is scored here in `findOccasions`, because only the
  whole city shows what is house style at a venue.
- **Last Chance** keeps its posters with a yellow "Ends Thu 5 Nov" `badge` on
  each (`PosterRow`'s top-left corner; top-right is the list markers), since the
  subtitle only shows on hover on desktop and the date is the point of the row.
  It comes from `getLastChanceMovies`, so `/near-me`'s Last Chance has it too.

**The picks are the films the editorial summary names**, in the order it names
them (`getFeaturedScreenings`). The summary's `links` cover every candidate the
model was shown, most of which the prose leaves out, so a link is only used
once the text mentions it. `generate-summary.mjs` gives each film link a
`highlight`: the list that claimed it (`kind`), a card label, and the showing
the highlight is about. Each film is claimed by exactly one list, so the label
always agrees with why the prose names it. A film picked for its reach
(`popular`) has no showing and shows its week's count instead. The label's
colour follows the kind (`TONE_BY_KIND`): blue for a format, pink for a night
that won't come round again, yellow for a final showing, grey otherwise.

A summary written before highlights existed features nothing, and its prose is
shown as before. A highlight is skipped rather than guessed when its film or
venue has left the dataset or its showing has started.

**A pick is a showing a reader can book.** `generate-summary.mjs` only
highlights showings that aren't sold out, as the occasion row does: a "One
night only" or a Q&A that has sold out is the one night nobody can have, and
occasions are the showings likeliest to sell out. A film whose every showing
this week is sold out can still be named for its reach (`popular`), which is
about no one showing. `getFeaturedScreenings` checks again at build time and
drops a highlight whose showing has sold out since the summary was written.
Only some venues report availability, so this narrows what is promoted rather
than guaranteeing it.

**The hero uses posters, not backdrops.** Backdrop stills were tried and the
poster read better: it keeps the site's colours, each slide looks alike, and
plenty of films have no good still. The pipeline doesn't publish film
backdrops anyway. The poster is blurred behind the section as a wash, which is
masked out at the bottom rather than faded to a colour, since the page's
background is a gradient and any flat colour draws a hard edge.

**Both are build-time snapshots read on the reader's clock** (`useNow`), so a
showing that has started drops out and "Tomorrow" stays true. The carousel
doesn't start rotating until then either, for a reduced-motion reader's sake:
the global stylesheet shortens their animations to nothing, and the progress
bar's end is what advances a slide. It never rotates for them at all, holds
while the pointer or focus is inside, and can be paused.

**The figures count the coming week over the catalogue's default categories**
(`getListingsStats`), so "Films" is roughly what its link opens on. The 35mm
figure is left out in a week with none. The static HTML carries the real
numbers and the count-up only rewrites text that is already right.

## London Cinemas by Borough

`/london-cinemas` leads with a map of what's on in each borough in the coming
week (`BoroughMap`) with the same figures ranked beside it as its `aside`
(`RankedBarChart`), then every borough A–Z. They are one figure rather than two
sections: the map shows where, the list the exact order, and the list is the
table view. On a touch screen a first tap on a borough selects it, filling the
readout and marking its row, and a second tap opens it (`MapReadout`); a tap
that went straight to the page left the map unreadable on a phone. A row
works the same way: its first tap selects the borough, bringing the map back
into view if the list has scrolled it away, and a second tap on the row or the
area opens it. Rows carry `getBoroughMapLinkAttributes`, so pointing at a row
outlines its borough and pointing at a borough marks its row. Built in `getBoroughWeek`, shared with the
page's story.

**A week, not everything listed.** How far ahead a venue publishes varies far
more than what it has on: measured, half the venues list 46 days ahead or
less, a tenth only 8, and some over 200. Counting everything would mostly
measure publishing habits (Lambeth goes from 79 films to 353, mostly the BFI's
months ahead). A week is the window nearly every venue fills.

**Shaded by films, not screenings.** One multiplex running a handful of films
all day outweighs a borough of small venues on screenings (Sutton: one venue,
21 films, 243 screenings). Screenings are in the readout instead of a toggle,
so both figures are to hand without two sets of bands.

**The figures are the home page's**, `getListingsStats` narrowed to a
borough's venues: films in the catalogue's default categories with a showing
in the next seven days, counted once per borough. A build-time snapshot, and
the page says which day it counted from. Darker means more. The bands are fixed floors
(`FILM_BAND_FLOORS`), not quantiles of this week, so a shade means the same
thing every week. A borough whose venues have nothing on is grey and one with
no venues a dashed outline, never a step of the ramp, so neither reads as a
little on. The readout says how many of a borough's venues had anything on,
because many venues showing little is the finding (Lewisham: 16 venues, 3 with
anything on).

**The outlines are generated and committed**
(`src/data/london-borough-boundaries.json`, `npm run
generate-borough-boundaries`), as the stations are: dissolving `data-analysed`'s
47MB of MSOA zones takes ~25s, which every build worker would pay.
`getBoroughMapShapes` projects them to SVG paths at build time, so the page
ships paths rather than a map library, and the map and its links are in the
static HTML. An MSOA zone split by the river is a MultiPolygon, whose
coordinates are polygons rather than rings; reading them as rings once
dropped Pimlico from Westminster and Erith from Bexley, leaving holes in the
map. Both the generator and `getVenueBorough` now read each part as a polygon
and fail on a malformed ring rather than dropping the zone.
Each borough page's map image (`public/images/boroughs/<slug>.png`, from
`scripts/fetch-borough-maps.js`) is drawn from the same dissolved outline, so
a change to the outlines means regenerating those too. The script skips
images that exist and needs a `GOOGLE_MAPS_API_KEY`, so delete the affected
ones first.

## Cinema Groups Index

`/cinema-groups` is a `ProgrammeCard` per chain with something on in the
coming week, most films first, and the chains with nothing on (Rooftop Cinema
Club out of season) named in a `LinkGrid` beneath. Built in
`getCinemaGroupsIndex`, shared with the page's story. Its figures are the home
page's rule again (default categories, next seven days), so a chain's count
agrees with `/london-cinemas` and the home page.

**A chain's card leads with what only it is showing**: films no venue
outside the chain has in the week, among the venues we list. That is what
tells chains apart — the same releases top every multiplex, while the
arthouse chains each have a dozen or more of their own (Curzon 18,
Picturehouse 16, BFI 25 in a measured week; Vue 3). Those posters come first,
busiest first, then the chain's busiest films, and each card prefers films no
earlier card has used, as the formats index does. **There is no "next
screening"**: a chain always has one starting within minutes, so naming it
would say nothing.

The intro sets the chains' share of venues against their share of the week's
screenings (19% against 90% when written), the one figure the index can give
that no chain's own page can.

## Accessible Screenings

`/accessibility` is the index: figures for every feature together, the venues
with the most accessible films, and a section per feature. Each feature also
has a page of its own at `/accessibility/<slug>`, built like a format page
(`EventDetailPageContent`: the films with an upcoming screening carrying the
feature, the cinemas running them, and a `base=all` link into the catalogue).
The features are a fixed set, so every one has a page whether or not anything
is on, and their slugs, titles and descriptions live in
`src/data/accessibility-features.ts`, which both pages read. Links that name a
feature (venue, borough, programme and near-me pages) go to its page through
`getAccessibilityFeatureUrl`.

**Both count upcoming screenings only**, from the build's `generatedAt`, so a
figure on the index is the figure on the page it links to.

**Subtitled is a bucket.** Venues label subtitles for viewers who can't hear
well and subtitles translating a film the same way, and often don't say which;
the pipeline files a screening under Hard of Hearing only when the hearing
support is clear. The copy says it covers both, and the two pages link to each
other. Don't describe it as one or the other until the data can tell them
apart.

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
  re-evaluates every build. Review-count floors come from `@clusterflick/catalogue/utils/movie-ratings.mjs`, shared with
  the Critics' Picks row.

**Every curated entry carries its TMDB id** (`tmdbId`), the id the dataset and a reader's
lists key films by, so a list can be held against a Seen list as well as matched to what's showing.
`npm run add-movie-list-tmdb-ids` fills them in from TMDB and writes them into the list files:
exact for an IMDb id (TMDB's find endpoint), otherwise a strict title search (`pickListMatch` in
`scripts/lib/movie-list-tmdb-ids.js`: title, original or `altTitles` match, within the list's
`yearTolerance`, nearest year, a tie left ambiguous). Whatever it can't match is listed for
settling by hand; entries with an id are skipped, so a re-run or a new list costs only the rest.
The script keeps its own table of list files (`add-movie-list-tmdb-ids.config.mjs`), since it
can't load the registry through the `@/` alias, and a unit test holds it to the registry.

**Matching** (`src/utils/get-movie-list-movies.ts`) is by `tmdbId` alone: the dataset keys its
films by TMDB id, so an entry resolves by direct lookup. The title, year, IMDb id and RT slug fallbacks
it used to try were dropped once every entry had an id; measured against a live release, all nine
lists showed exactly the same films either way. `tmdbId` is required (`null` for a film TMDB doesn't
have, which nothing matches), and a work released in parts takes its first part's id.
`createMovieMatcher` (`@/utils/match-movie`) keeps the title-and-year resolution for the Letterboxd
import, whose exports carry no TMDB id.

**A reader's progress through a list** (`ListProgress`, signed in only) is
their Seen list held against the list's ids (`getMovieListTmdbIds`, unique and
non-null, so a list with a repeated or missing film counts fewer than its
entries). On each `/lists` card it is "X of Y seen" and a ring at the card's
bottom right; on the list's page a line saying how many unseen films are
showing, linking to the catalogue with just those films selected
(`getMoviesFilterUrl`); and on `/personalise`, under the Seen stats, every list the reader
has seen a film from, furthest through first, as `VenueCard`s with the ring as
the card's `aside` (lists with none seen are left to `/lists`). Curated lists
only — a computed list's membership changes every build, so "of Y" would too.
A multi-part work counts once its first part is seen.

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

## Published Data

The two datasets licensed for reuse are hosted on this site rather than pointed at on GitHub.
`/datasets` documents them (what's in them, the addresses, the schema, how often they change, how to
detect new data) and `/data-licence` licenses them; the URL constants live in `@/app/datasets/data`. `scripts/fetch-published-data.js` downloads the latest `data-transformed` and
`data-calendar` releases into `public/datasets/`:

- `datasets/venues/<venue-id>.json` — the venue's transformed listings
- `datasets/calendars/<venue-id>.ics` — its calendar feed
- `datasets/schema.json` — the JSON files' schema, from `clusterflick/scripts` (main), the one
  `transform` validates each venue's output against before release
- `datasets/index.json` — every venue, its files, the release each dataset came from, and the
  licence
- `datasets/latest.json` — only the index's `generatedAt` and `releases`, written from the same
  object, so a consumer can poll it for new data. Consumers compare the release **tags**, never
  `generatedAt`: the site deploys more than once per release (dispatched by both `data-calendar`
  and `data-matched`), and `generatedAt` moves with every deploy whether the data changed or not

**The index describes each venue**: name, type, group, address, coordinates, the venue's own
listings URL and its page here, taken from the combined data the workflow downloads first. A file
named after a domain says nothing about where the cinema is, and the licence page already counted
the venue records as ours to give. Social handles and the pipeline's bookkeeping (`structure`,
`programming`) are left out. A venue with files but no details fails the build, since the releases
come from one run and a mismatch is something to look into. The details sit beside the existing
`data` and `calendar` keys, so a reader of those is unaffected.

**The names are fixed, not content-hashed**, because they are addresses other people link to,
fetch on a schedule and subscribe to — the datasets page, the venue pages' calendar subscription
links and the calendar page all use them. Freshness is a Cloudflare cache rule on `/datasets/`
that makes them cacheable (`.ics` otherwise isn't) and respects the origin's TTL at the edge and
in the browser, which is GitHub Pages' own `max-age=600`. It sits after the "Cache JSON blobs"
rule, which gives every `.json` a year, because a later Cache Rule overrides an earlier one.
Respecting the origin rather than setting a TTL is deliberate: on our plan an override can't go
below two hours, and ten minutes keeps a reader, and the site's own calendar page, within one
cache period of a deploy. The same rule matches `/data/current.json`, the one fixed name under
`data/` (see the catalogue package), which the JSON rule would otherwise hold for a year, leaving
the Workers that read it on the release it named then. The smoke tests check those headers, since a
rule that stops matching would quietly serve year-old data.

**The calendars are served uncompressed**, and that is accepted rather than an oversight. GitHub
Pages gzips the `.json` files but not `text/calendar`, and Cloudflare only compresses the content
types on its default list, which `text/calendar` isn't on. A Compression Rule doesn't change that:
one was tried matching the path, then the media type, with the Zstandard preset and with a custom
algorithm list, and every response still came back uncompressed while `robots.txt` on the same
zone came back as Brotli. Rewriting the `Content-Type` to something compressible would risk
calendar apps no longer recognising the feed, and a Worker to compress them is a lot of
machinery for this. A typical feed is ~190KB and the largest ~700KB; it is fetched by calendar
apps a few times a day and served from Cloudflare's cache, so the cost is the download, not the
origin. If feed size ever matters, the lasting fix is a smaller feed from `data-calendar`.

**Not under `data/`.** That directory is the site's own: content-hashed listing chunks, cached
forever and carried forward between deploys by `carry-forward-static`, read only by the site and
its own Workers, in a shape the catalogue package defines (below). These are the opposite on
every count, so they get a directory of their own — one
cache rule covers it, nothing carries it forward (each deploy is exactly one release, and the
GitHub releases remain the archive of earlier ones), and `fetch-published-data` owns all of it.

The download rules are the calendar's (above): retried, collected, and any file that still fails
fails the build, because a missing file 404s for whoever relied on it. The index is written last,
so it only ever describes a complete set. A release that can't be listed fails the build too;
only one that doesn't exist (a 404) is let through, as an empty index.

## Data Status

`/datasets/status` is the release history of the two published datasets: when they started, how
many releases, the current and longest streak of days with one, a 90-day bar per dataset and the
time of day releases land. It is a record of what has happened, with no commitment about what
happens next — keep any SLA, notice period or guarantee off it.

**The history is `clusterflick/data-analysed`'s release log**, not the releases API.
`data-transformed` and `data-calendar` each dispatch its `Release Log` workflow as they publish,
which appends `{ dataset, repository, tag, publishedAt }` to `release-log.jsonl` on a
`release-log-YYYYMM` release. `npm run fetch-release-log` downloads every month by name into
`/release-log/` (gitignored, read at build time, never published), and a missing past month or a
failed download fails the build: a hole in the history would read as days without a release. The
log is dispatched at the same moment as the site build, so it can be a release behind;
`getReleaseStatus` adds index.json's releases to it.

**Times are release times** (`publishedAt`), not deploy times. The files under `/datasets/` change
when the site next deploys after a release, and the page says so rather than measuring it.

**Today is the reader's, not the build's.** A pipeline that stops also stops the builds, so a page
that only knew its build date would show a full row of green and an unbroken streak indefinitely.
`useNow` renders the static HTML against the build time and then moves to the browser's clock, and
the date-dependent parts (`getStreaks`, `getRecentDays`, `getDailyRange`) are redone against it.
`ReleaseFreshness` does the same for "Last new data X hours ago", checks `/datasets/latest.json`
for anything newer than the build, and turns into a warning past `STALE_AFTER_HOURS` (36). The
time-of-day distribution (`getTimeOfDay`) is built once, from the `data` releases of the last 90
days, with the calendar's lag behind them given as a figure rather than a second near-identical
series.

## Near Me

Everything location-dependent on `/near-me` comes from one hook, `useNearMe`
(`src/hooks/use-near-me.ts`), computed on the client once the reader's position
is known; the page ships only build-time venue, club and festival counts.

**One nearby set feeds everything.** It is `getNearbyVenueIds`, the rule behind
the Near Me pill's Auto radius around the reader, plus the reader's locals. The page's rows,
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

Two Venues pills pick the venues around a place, which need not be where the
reader is: a visitor plans from where they'll be. **Near Me** is one tap: it
locates the reader and selects the venues around them on Auto, as the old
Venues Near Me did. **Near a Station…** opens the same settings with the
station-or-venue search focused, and never asks for the reader's location.

**The ellipsis is what makes the second pill honest.** A pill that only reveals
controls reads like an option that should select something; "…" is the usual
mark for "needs more input first". An earlier single "Nearby" pill that only
opened the settings was unclear for exactly that reason, and folding the
station search behind Near Me instead meant a location prompt for readers who
never wanted one.

**The settings are shared and open under the pills while either is chosen**:
"Near you · 10 venues", the radius chips, and "Somewhere else?" over the
station-or-venue search; Use my location comes back once somewhere else is
picked. **The checked pill follows the origin**, not the last tap: picking King's
Cross (or a venue) checks Near a Station…, Use my location moves it to Near Me.
Without a position, Near Me still checks its pill and opens the settings, says
why, and focuses the station search. The picker owns locating
(`VenuePlacePicker`'s `locate` handle), so the pill and Use my location can't
handle "nothing near you" differently.

**Places** (`@clusterflick/catalogue/places`) are `here`, a `station:<slug>` or a `venue:<id>`.
Stations are the Underground, Overground, Elizabeth line and DLR, generated
from TfL's open data by `npm run fetch-london-stations` into
`packages/catalogue/src/data/london-stations.json` and committed, since a build shouldn't depend on
TfL's API. TfL's terms want their credit on the About page. The list is
imported dynamically, when the picker first shows. Boroughs are not places: a
borough is an area whose venues are decided by boundary, not a point, and its
page links to its venues already.

**The radius defaults to Auto**, Venues Near Me's rule (`getNearbyVenueIds`:
half a mile, widened until there are ten venues, up to two), which suits a
dense centre and a sparse suburb alike. ½, 1, 2 and 3 miles are the reader's
and never grow. A pick that finds nothing leaves the selection alone and says
so, keeping the place for a wider radius.

**Auto's radius belongs to the area, not the exact point**
(`getNearbyRadius`). The ten-venue rule is worked out at the centres of the
four cells of a fixed ~500m grid nearest the place and blended by distance,
then every venue within that radius of the place itself is picked. Worked out
at the exact point, the rule jumps a whole 0.1-mile step when the tenth venue
crosses its line, bringing in or dropping a band of venues at once, and GPS
drift was enough to do it: two windows 30m apart in Shoreditch stopped at 0.5
and 0.6 miles, one with Curzon Hoxton and one without, 2 films today against 9.
Blended, the radius moves by hundredths of a mile as the place does, so a venue
changes only when it is itself on the edge. Over 1,500 points in zones 1–2,
moving 30m changed today's films by three or more at 8.4% of them, and at 4.1%
blended, finding as many films; a fixed 1-mile radius is ~3%. The cost is that
ten venues is no longer promised at the exact point: the radius is the one the
area needs. Counting programme instead of venues (screenings or films within
reach) was measured too, and mostly moved the jumps rather than removing them,
fixing about four spots for every three it broke.

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

**Auto is picked again once the listings are complete** (`VenueOriginSync`,
`reresolveAutoVenueOrigin`). Auto counts the venues with something showing, and
the listings arrive in chunks, so a pick made mid-load counted only the venues
in the chunks already in. "Near me today" tapped as the catalogue opened picked
10 venues around Soho rather than 28, and showed one event where 1 mile found
fifteen. While the selection is still the one Auto made, it is re-picked over
the whole dataset when loading finishes (not per chunk, and not while any chunk
has failed). The "Near me today" pill also reads "Loading…" and waits until
then, so the re-pick is a fallback rather than something the reader watches
happen.

**Auto counts venues with anything on, not anything on for this search**, so
a place can pick ten venues and still empty the grid — a watchlist for today
finds nothing in a dense centre's half mile. It stays that way: a radius that
re-picked whenever the dates or categories changed would stop meaning one set
of venues, and Near Me relies on it meaning one. Instead the next radius out
is offered where the emptiness shows:

- **In the picker**, when the place's venues have nothing for the other
  filters, a notice says so and names the nearest radius that has
  ("Within 1 mile, 4 events do"), with a button to pick it
  (`findWiderVenueOrigin`).
- **In the empty state**, a wider-radius move sits just ahead of All venues,
  on the grid and on a film page (`buildRadiusMove` in `suggest.ts`, given the
  `venueOrigin` and `placeVenues`). Before it, All venues was the only venue
  move, and all of London is far too big a step. The radius is settled when
  the move is applied, so a pair with the dates can stop nearer than the move
  alone would need. The offer carries its `venueOrigin`, which the caller
  remembers beside the state, so the selection still reads "Within 1 mile of
  you" and the picker can change it again.

Both read the radii in `RADIUS_OPTIONS` that keep every venue picked and add
one (`getWiderVenueOrigins`), over every venue with something showing in the
whole dataset (`getPlaceVenues`) — not the movies the engine probes, which on
a film page are that one film.

## Filters in the Address

The filters are one tab-wide state (`FilterConfigProvider`, mirrored to session
storage), and **the films grids — `/catalogue` and `/planner` — also keep it in
their address** (`useFilterUrlSync`). Each history entry then holds the filters
it was showing, so Back lands on them: grid → film → a cast name → Back → Back
returns to the grid as it was, not to the cast filter the link set.

- **Changes are written with `replaceState`**: tapping through chips doesn't
  fill the history, and Back still leaves the page. **Presets are pushed** as
  an entry of their own: "Near me today" is somewhere to go rather than a
  tweak, so Back returns to the filters it replaced (Highly Rated, say). The
  context marks the preset's state (`takeHistoryEntry`, matched by identity),
  and a preset that changes nothing in the address adds no entry.
- **Only filter params are rewritten** (`replaceFilterParams`); a page's own
  params (the planner's `day` and `view`) are kept, and the planner's writer
  keeps the filters' in turn. A param is the filters' if `base` or any module's
  `fromUrlParams` reads it.
- **A bare address means where you left off, unless reached by Back or
  Forward.** Followed from a link (the nav's Films, "Back to film list"), it
  carries on with the session's filters, so no link has to carry them to keep
  them. Reached by traversal it means the defaults, since every entry the grid
  shows is written with its filters and only the defaults write nothing.
  Traversal is told from a popstate seen before the page mounted, or for a
  reloaded document its navigation entry's `back_forward` type.
- **The film page reads the filters but keeps them out of its address**
  (`applyUrlParams` adopts what a link hands it, then strips it), so a film
  link someone copies doesn't carry their filters.
- **Written filters must read back as the same state.** The round trip is
  tested in `manager.test.ts`; a new filter module has to survive it.
- A date in the address is a day, not "today", so an old entry or bookmark
  falls back to the default window once its day has passed
  (`discardStaleDates`), as session storage always did.

## Multi-film Events

A double bill, marathon or shorts programme usually matches no single film, so
its own `genres`, `directors` and `actors` are empty (genres hold only the
"Uncategorised" placeholder) while each film in `includedMovies` carries its
own. The genre and people filters, the genre pages and the overlay's counts
read an event through `getMovieAndIncluded` (`@clusterflick/catalogue/utils/get-movie-and-included`):
the event plus the films it screens, any one matching, as every multi-select
filter reads "or". An unmatched event whose films supply genres stops being
Uncategorised. A shorts programme whose venue listed no films still has
nothing to read, and stays Uncategorised.

The title search reads them the same way: an event is found by the title of
any film it screens as well as by its own (`matchesTitleSearch` in
`packages/catalogue/src/filters/modules/search.ts`). An all-dayer's name rarely
says what it shows, and a reader searching "Talking About Trees" wants to know
they can see it, not that nothing is listed under that name. The near-miss
correction counts those titles as spelled right too, so it never rewrites a
query that names a film an event screens.

A film is also found by its other English titles (`alternativeTitles`, from
the pipeline: the UK and US release titles that differ from `title`). The
displayed title is TheMovieDB's US one, so "Zootropolis", the name every
London venue uses, found nothing until these were searched. They are never
displayed. What the venue itself calls a showing (`showing.title`) is
deliberately not searched by the title search, since it carries event branding
("Kids Movie Club: …") that would match far more than the film.

The reverse of "Part of" is `getIncludedListings`
(`@clusterflick/catalogue/utils/get-included-listings`): an event's films, each
with its own listing when it is also showing on its own, matched by TMDB id as
`getContainingEvents` is. The film page's "Single Showing" buttons and the MCP
server's `get_film` read it.

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
- **More Than a Screening** → every kind of occasion (`getOccasionsUrl`), described as "with an
  occasion". A superset too: the row is the occasions scored rare across the city, one night per
  film, while the filter is the plain fact of an occasion, house-style intros included. The rarity
  is the row's editorial cut; the grid is what else is more than a screening.

The rest need filters that don't exist yet (last chance, just added) or a sort (Showing Across
London). Lists and collections need no link: their pages already show every member that is
showing.

**The rating filters** (`packages/catalogue/src/filters/modules/ratings.ts`) are three, one per source, built from
one factory as the people and format filters are: Letterboxd (`?letterboxd=`, out of 5), IMDb
(`?imdb=`, out of 10) and Rotten Tomatoes (`?rottenTomatoes=`, 0–100). Each is a minimum on a
`Slider` in the overlay's "Ratings" Refine row. They are not
one blended score, because the sources don't measure the same thing: Letterboxd and IMDb publish an
average, Rotten Tomatoes the share of critics who liked a film, and of 193 films carrying both a
Letterboxd average and a Tomatometer score, 73 fell on opposite sides of an 80% line.

- **Review floors are the site's existing ones** (`@clusterflick/catalogue/utils/movie-ratings.mjs`: 2,000 Letterboxd
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

## Reports

`/reports/<id>` are dated snapshots of what the listings show, written to be
cited: a journalist writes the story and links the report as its source, which
is the point of them. They also link on to the listing pages they're about (a
borough report is linked from that borough's page, via `boroughSlugs` in
`src/data/reports/index.ts`).

**The numbers are fixed, not computed at build.** The build holds only what is
showing now, and a report says what was true when it was written. Each
report's data sits beside the registry (`src/data/reports/<id>.ts`) with a
comment saying how it was derived, and the scripts that produced it are
linked from the report (a gist: they're one-off, not a reusable pipeline,
so they don't belong in `data-analysed`). Year-long figures come from rebuilding
every screening out of the daily `data-combined` releases, each release
supplying the screenings up to the next one (the everycinema.london history
method), so nothing is counted twice. Two traps when doing that: venue ids
changed scheme on 28 January 2026, so count venues by name and place rather
than id; and a new name at the same address can be a new operator (ODEON
Camden closed, Plaza Camden opened), so a rename must be named explicitly.
Format data (`format.source`) only exists from July 2026.

Exploring the data belongs on everycinema.london; a report is the finished,
citable claim.

## Search Engines

**The sitemap lists canonical addresses only.** The export uses
`trailingSlash: true`, so a page lives at its path plus `/` and the bare path
301s there. `sitemap.ts` builds every entry through `pageUrl`, from the same
`get*Url` helpers the pages use for their canonicals; `sitemap.test.ts` holds
it to that. Departed films are left out: their pages stay up so links land,
but each says little more than that the film has stopped showing, and they
were two fifths of the sitemap.

**`lastmod` only where a page has a date of its own** (update days, their
landing page, reports). Stamping every entry with the build time claimed 2,500
pages changed on every deploy, several times a day, and Google stops trusting
a sitemap's dates once they are routinely wrong — the true ones included.

**Departed film pages are `noindex`** (`follow` still on). Google was
already filing them as soft 404s or declining to index them, and re-checking
them spent crawling the films that are showing needed. Film pages churn
weekly, and indexed pages fell steadily from ~2,100 to ~880 as new films were
indexed more slowly than old ones left; the durable pages (venues, boroughs,
groups, clubs, festivals, genres, formats) are the ones search can build on.
A film that returns drops the tag on the next build.

**`/llms.txt` leads agents to the datasets** (`src/app/llms.txt/`). Little is
known to read it, which is why it is small: the published datasets first, by
the constants in `@/app/datasets/data`, then the site's URL shapes and index
pages. It never lists pages one by one, since the sitemap does that and they
change weekly, and there is no `llms-full.txt`. `content.test.ts` checks
that every page it links is one the site builds, at its canonical address.

**A page's `<title>` names what it is found by**, not just what it is called.
Film pages read "Heat (1995) — Showtimes in London" (a departed film keeps
the bare name, having none), venue pages "Prince Charles Cinema — What's On
& Showtimes", and `/venues` is "Every Cinema in London". Social titles keep
the short name.

## Documented Elsewhere

These write-ups live beside the code they describe. The nested `CLAUDE.md`
files load when you work in their directory; read the relevant one before
changing a feature from outside it (a site component using a filter, say).

- **Personalisation** (accounts, lists, film details, capabilities, public
  profiles, email alerts, AI assistant access, Firestore rules) — `docs/personalisation.md`.
  Read it before touching `src/lib/user-*`, `src/lib/firebase`, `src/app/personalise`,
  `src/app/profile-shell`, `src/app/connect`, `firestore.rules` or anything signed-in.
- **Filters** (cast & crew, films, hide seen, clubs & festivals, occasions,
  the thin-result notice, zero-result suggestions) —
  `packages/catalogue/src/filters/CLAUDE.md`.
- **Filter overlay** — `src/components/filter-overlay/CLAUDE.md`.
- **Venue calendars** — `src/app/venues/[slug]/calendar/CLAUDE.md`.

## Testing

- **Storybook + Vitest:** Component tests run via `@storybook/addon-vitest` with
  Playwright browser provider (headless Chromium)
- **Firestore rules:** `npm run test:rules` runs `firestore-rules/` against
  the emulator (needs Java), in a CI job of its own
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
