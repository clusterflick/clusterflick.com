# 🍿 Clusterflick

> Every film, every cinema, one place.

Clusterflick is an open-source web app that aggregates film screenings from
across London cinemas into a single, searchable interface. Compare screenings,
find showtimes, and discover what's on—whether you're chasing new releases or
cult classics.

## ✨ Features

- **Unified Cinema Listings** — Browse film screenings from dozens of London
  cinemas in one place
- **Rich Movie Data** — View ratings and reviews from IMDb, Letterboxd,
  Metacritic, and Rotten Tomatoes
- **Multiple Event Types** — Find movies, TV screenings, comedy, music events,
  talks, workshops, and more
- **Accessibility Info** — Filter by accessibility features including audio
  description, subtitles, hard of hearing support, relaxed screenings, and
  baby-friendly showings
- **Virtualized Grid** — Fast, smooth browsing of hundreds of movie posters with
  react-virtualized
- **Static Export** — Fully static site for fast loading and easy deployment

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (Static Export)
- **UI:** [React](https://react.dev/) 19
- **Grid Rendering:**
  [react-virtualized](https://github.com/bvaughn/react-virtualized)
- **Data Compression:**
  [compress-json](https://github.com/nickyout/compress-json)
- **Styling:** CSS Modules
- **Linting:** ESLint + Prettier

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm

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
# Lint the codebase
npm run lint

# Format code with Prettier
npm run format

# Process combined data into chunks for the frontend
npm run process-combined-data
```

## 📁 Project Structure

```
clusterflick.com/
├── combined-data/        # Raw combined cinema data (input)
├── matched-data/         # Review data from external sources
├── out/                  # Static export output
├── public/
│   └── data/             # Processed & chunked data files
├── scripts/
│   └── process-combined-data.js   # Data processing script
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── about/        # About page
│   │   ├── movies/[id]/  # Movie detail pages
│   │   └── page.tsx      # Home page (movie grid)
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   └── utils/            # Utility functions
└── package.json
```

## 📊 Data Pipeline

Clusterflick's data flows through several stages:

1. **Retrieved** — Cinema websites are scraped for showings data
   ([clusterflick/data-scraped](https://github.com/clusterflick/data-retrieved))
2. **Transformation** — Raw data is normalized and enriched
   ([clusterflick/data-transformed](https://github.com/clusterflick/data-transformed))
3. **Combination** — Individual venue data is merged by movie
   ([clusterflick/data-combined](https://github.com/clusterflick/data-combined))
4. **Processing** — The `process-combined-data` script compresses data and
   splits it into chunks for efficient loading
5. **Matching** — Movie data is matched with ratings from IMDb, Letterboxd,
   Metacritic, and Rotten Tomatoes

Data is refreshed automatically every morning.

## 🔗 Related Repositories

| Repository                                                                        | Description                    |
| --------------------------------------------------------------------------------- | ------------------------------ |
| [clusterflick/data-transformed](https://github.com/clusterflick/data-transformed) | Per-venue JSON data files      |
| [clusterflick/data-combined](https://github.com/clusterflick/data-combined)       | Combined data grouped by movie |
| [clusterflick/data-calendar](https://github.com/clusterflick/data-calendar)       | ICS calendar files per venue   |

## 📝 Data Access

The data is freely available in multiple formats:

- **JSON per venue** — Individual JSON files for each cinema
- **Combined JSON** — All showings in a single file, grouped by movie
- **ICS Calendars** — Import cinema schedules into your calendar app

Visit the [About page](https://clusterflick.com/about/) for download links.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
