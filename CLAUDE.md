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
