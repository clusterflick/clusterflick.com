# Clusterflick

**[clusterflick.com](https://clusterflick.com)** · **[Storybook (Chromatic)](https://main--6984c607d80835bfe88c8309.chromatic.com)**

> Every film, every cinema, one place.

Clusterflick is an open-source web app that aggregates film screenings from
across London cinemas into a single, searchable interface. Compare screenings,
find showtimes, and discover what's on — whether you're chasing new releases or
cult classics.

## Features

- **Unified Cinema Listings** — Browse film screenings from 240+ London cinemas
  in one place
- **Rich Movie Data** — View ratings and reviews from IMDb, Letterboxd,
  Metacritic, and Rotten Tomatoes
- **Multiple Event Types** — Find movies, TV screenings, comedy, music events,
  talks, workshops, and more
- **Venues & Boroughs** — Browse all cinemas by venue or explore all 33 London
  boroughs
- **Festival Pages** — Dedicated pages for London film festivals with full
  programme listings
- **Accessibility Filters** — Filter by audio description, subtitles, hard of
  hearing support, relaxed screenings, and baby-friendly showings
- **Geolocation** — Sort venues by distance from your current location
- **Shareable Filters** — Share your current filter state via URL
- **Hide Past Showings** — Toggle to filter out screenings that have already
  started
- **Virtualized Grid** — Fast, smooth browsing of hundreds of movie posters with
  react-virtualized
- **Static Export** — Fully static site for fast loading and easy deployment

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (Static Export)
- **UI:** [React](https://react.dev/) 19
- **Grid Rendering:**
  [react-virtualized](https://github.com/bvaughn/react-virtualized)
- **Styling:** CSS Modules
- **Testing:** Storybook + Vitest, Playwright (smoke tests), Chromatic (visual
  regression)
- **Linting:** ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 24

### Installation

```bash
# Clone the repository
git clone https://github.com/clusterflick/clusterflick.com.git
cd clusterflick.com

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Building for Production

```bash
# Build the static site
npm run build

# The output will be in the `out/` directory
```

### Other Commands

```bash
# Lint the codebase (TypeScript + ESLint)
npm run lint

# Format code with Prettier
npm run format

# Run Storybook
npm run storybook

# Run Playwright smoke tests against the deployed site
npm run smoke-test

# Run smoke tests against a local build
npm run build && npm start
SITE_URL=http://localhost:3000 npm run smoke-test
```

## Project Structure

```
clusterflick.com/
├── combined-data/         # Raw combined cinema data (input)
├── matched-data/          # Review data from external sources
├── out/                   # Static export output
├── public/
│   └── data/              # Processed & chunked data files
├── scripts/               # Build-time data processing scripts
├── smoke-tests/           # Playwright E2E smoke tests
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── about/         # About page
│   │   ├── accessibility/ # Accessibility features & stats
│   │   ├── festivals/     # Festival list + detail pages
│   │   ├── london-cinemas/# Borough index pages
│   │   ├── movies/[id]/[slug]/  # Movie detail pages
│   │   ├── venues/[slug]/ # Venue detail pages
│   │   └── page.tsx       # Home page (movie grid)
│   ├── components/        # Reusable UI components
│   ├── data/              # Static data (festivals, boroughs)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Domain logic (filter system)
│   ├── state/             # React context providers
│   └── utils/             # Utility functions
└── package.json
```

## Data Pipeline

Clusterflick's data flows through several stages:

1. **Retrieved** — Cinema websites are scraped for showings data
   ([clusterflick/data-retrieved](https://github.com/clusterflick/data-retrieved))
2. **Transformation** — Raw data is normalized and enriched
   ([clusterflick/data-transformed](https://github.com/clusterflick/data-transformed))
3. **Combination** — Individual venue data is merged by movie
   ([clusterflick/data-combined](https://github.com/clusterflick/data-combined))
4. **Processing** — The `process-combined-data` script compresses data and
   splits it into chunks for efficient loading
5. **Matching** — Movie data is matched with ratings from IMDb, Letterboxd,
   Metacritic, and Rotten Tomatoes

Data is refreshed automatically every morning.

## Related Repositories

| Repository                                                                        | Description                    |
| --------------------------------------------------------------------------------- | ------------------------------ |
| [clusterflick/data-transformed](https://github.com/clusterflick/data-transformed) | Per-venue JSON data files      |
| [clusterflick/data-combined](https://github.com/clusterflick/data-combined)       | Combined data grouped by movie |
| [clusterflick/data-calendar](https://github.com/clusterflick/data-calendar)       | ICS calendar files per venue   |

## Data Access

The data is freely available in multiple formats:

- **JSON per venue** — Individual JSON files for each cinema
- **Combined JSON** — All showings in a single file, grouped by movie
- **ICS Calendars** — Import cinema schedules into your calendar app

Visit the [About page](https://clusterflick.com/about/) for download links.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
