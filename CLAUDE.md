# CLAUDE.md

## Project Overview

Clusterflick is a static Next.js web application that aggregates film screenings
from 240+ London cinemas into a single searchable interface. It uses a data
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
- **Performance:** react-virtualized for large poster grids, data chunking,
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
