import type { Meta, StoryObj } from "@storybook/react";
import VenueDetailPageContent from "@/app/venues/[slug]/page-content";
import type { VenueDetailPageContentProps } from "@/app/venues/[slug]/page-content";
import VenueBlurb from "@/components/venues/princecharlescinema.com";
import type { VenueAttributes } from "@/utils/get-venue-attributes";
import type { Movie, Venue } from "@/types";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

/**
 * Venue Detail Page Stories (Prince Charles Cinema)
 *
 * Uses real data from public/data files. The component fetches and
 * decompresses the actual data to render the venue detail page.
 * Venue attributes and image paths are hardcoded since those are
 * resolved via Node.js filesystem APIs at build time.
 */

const VENUE_ID = "princecharlescinema.com";

// Hardcoded venue attributes (normally read from filesystem via getVenueAttributes)
const princeCharlesAttributes: VenueAttributes = {
  id: VENUE_ID,
  name: "Prince Charles Cinema",
  domain: "https://princecharlescinema.com",
  socials: {
    letterboxd: "thepcc",
    twitter: "ThePCCLondon",
    instagram: "princecharlescinema",
  },
  url: "https://princecharlescinema.com",
  address: "7 Leicester Place, London, WC2H 7BY, UK",
  geo: { lat: 51.51149384362524, lon: -0.130186840699272 },
  structure: "solo",
  type: "Cinema",
};

// Image paths (served by Storybook's staticDirs from public/)
const VENUE_IMAGE_PATH = `/images/venues/${VENUE_ID}.jpg`;
const VENUE_MAP_PATH = `/images/venues/maps/${VENUE_ID}.png`;

type VenueDetailData = Omit<VenueDetailPageContentProps, "VenueBlurb">;

async function loadVenueDetailData(): Promise<VenueDetailData | null> {
  const metaData = await fetchMetaData();
  const allMovies = await fetchAllMovies(metaData);

  const venue: Venue = metaData.venues[VENUE_ID]
    ? { ...metaData.venues[VENUE_ID], id: VENUE_ID }
    : {
        id: VENUE_ID,
        name: princeCharlesAttributes.name,
        url: princeCharlesAttributes.url,
        address: princeCharlesAttributes.address,
        geo: princeCharlesAttributes.geo,
        structure: princeCharlesAttributes.structure,
        type: princeCharlesAttributes.type,
      };

  // Collect movies showing at this venue
  let movieCount = 0;
  let performanceCount = 0;
  const venueMovies: { movie: Movie; performanceCount: number }[] = [];

  for (const movie of Object.values(allMovies)) {
    const venueShowingIds = new Set<string>();
    for (const [showingId, showing] of Object.entries(movie.showings)) {
      if (showing.venueId === VENUE_ID) {
        venueShowingIds.add(showingId);
      }
    }
    if (venueShowingIds.size > 0) {
      movieCount++;
      let moviePerfCount = 0;
      for (const perf of movie.performances) {
        if (venueShowingIds.has(perf.showingId)) {
          performanceCount++;
          moviePerfCount++;
        }
      }
      venueMovies.push({ movie, performanceCount: moviePerfCount });
    }
  }

  venueMovies.sort((a, b) => {
    return a.movie.normalizedTitle.localeCompare(b.movie.normalizedTitle);
  });

  const GRID_MOVIE_LIMIT = 72;
  const gridMovies = venueMovies.slice(0, GRID_MOVIE_LIMIT);
  const gridMoviesTruncated = venueMovies.length > GRID_MOVIE_LIMIT;

  return {
    venue,
    attributes: princeCharlesAttributes,
    imagePath: VENUE_IMAGE_PATH,
    mapImagePath: VENUE_MAP_PATH,
    movieCount,
    performanceCount,
    gridMovies,
    gridMoviesTruncated,
  };
}

function VenueDetailWithRealData() {
  return (
    <StoryDataLoader<VenueDetailData>
      loader={loadVenueDetailData}
      loadingMessage="Loading venue data..."
    >
      {(data) => <VenueDetailPageContent {...data} VenueBlurb={VenueBlurb} />}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Venue Detail",
  component: VenueDetailWithRealData,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    msw: {
      handlers,
    },
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof VenueDetailWithRealData>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Venue detail page in loading state - data is still being fetched
 * and a loading indicator is shown.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: loadingHandlers,
    },
  },
};

/**
 * Prince Charles Cinema venue detail page fully loaded with
 * venue logo, social links, about blurb, address with map,
 * and a grid of films currently showing at the venue.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};
