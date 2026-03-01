import type { Meta, StoryObj } from "@storybook/react";
import BoroughPageContent from "@/app/london-cinemas/[borough]/page-content";
import type {
  BoroughVenueItem,
  NeighborBorough,
  BoroughFilmClub,
  BoroughFestival,
  BoroughAccessibilityStat,
} from "@/app/london-cinemas/[borough]/page-content";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { getDistanceInMiles } from "@/utils/geo-distance";
import { getBoroughUrl } from "@/utils/get-borough-url";
import { getVenueUrl } from "@/utils/get-venue-url";
import type { Venue } from "@/types";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import { groupVenuesByBoroughSimple } from "../utils/group-venues-by-borough-simple";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

/**
 * Borough Detail Page Stories (Hackney)
 *
 * Uses real data from public/data files. Shows the venue list,
 * film counts, and nearby boroughs for a specific London borough.
 * Uses a simple center+radius approximation for grouping (the real
 * pages use GeoJSON boundary data which requires Node.js fs access).
 */

const BOROUGH_SLUG = "hackney";

type BoroughDetailData = {
  boroughName: string;
  boroughSlug: string;
  boroughDescription: string;
  venues: BoroughVenueItem[];
  totalMovies: number;
  neighborBoroughs: NeighborBorough[];
  filmClubs: BoroughFilmClub[];
  festivals: BoroughFestival[];
  accessibilityStats: BoroughAccessibilityStat[];
};

async function loadBoroughDetailData(): Promise<BoroughDetailData | null> {
  const metaData = await fetchMetaData();
  const allMovies = await fetchAllMovies(metaData);

  const borough = LONDON_BOROUGHS.find((b) => b.slug === BOROUGH_SLUG);
  if (!borough) return null;

  const venues: Record<string, Venue> = {};
  for (const [id, venue] of Object.entries(metaData.venues)) {
    venues[id] = { ...venue, id };
  }

  const map = groupVenuesByBoroughSimple(venues);
  const boroughVenues = map.get(BOROUGH_SLUG) || [];

  if (boroughVenues.length === 0) return null;

  // Count movies and performances per venue
  const eventCounts = new Map<string, number>();
  const perfCounts = new Map<string, number>();
  for (const movie of Object.values(allMovies)) {
    const venueIds = new Set<string>();
    for (const showing of Object.values(movie.showings)) {
      venueIds.add(showing.venueId);
    }
    for (const venueId of venueIds) {
      eventCounts.set(venueId, (eventCounts.get(venueId) || 0) + 1);
    }
    for (const perf of movie.performances) {
      const showing = movie.showings[perf.showingId];
      if (showing) {
        perfCounts.set(
          showing.venueId,
          (perfCounts.get(showing.venueId) || 0) + 1,
        );
      }
    }
  }

  const venueItems: BoroughVenueItem[] = boroughVenues
    .map((venue) => ({
      id: venue.id,
      name: venue.name,
      href: getVenueUrl(venue),
      type: venue.type,
      eventCount: eventCounts.get(venue.id) || 0,
      performanceCount: perfCounts.get(venue.id) || 0,
      imagePath: null, // Venue images require fs access (server-only)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Count total unique movies across borough venues
  const boroughVenueIds = new Set(boroughVenues.map((v) => v.id));
  const boroughMovieIds = new Set<string>();
  for (const movie of Object.values(allMovies)) {
    for (const showing of Object.values(movie.showings)) {
      if (boroughVenueIds.has(showing.venueId)) {
        boroughMovieIds.add(movie.id);
        break;
      }
    }
  }

  // Get neighboring boroughs
  const neighborBoroughs: NeighborBorough[] = LONDON_BOROUGHS.filter((b) => {
    if (b.slug === BOROUGH_SLUG) return false;
    if (!map.has(b.slug)) return false;
    const distance = getDistanceInMiles(borough.center, b.center);
    return distance <= borough.radiusMiles + b.radiusMiles + 1;
  })
    .map((b) => ({
      name: b.name,
      href: getBoroughUrl(b),
      venueCount: (map.get(b.slug) || []).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    boroughName: borough.name,
    boroughSlug: borough.slug,
    boroughDescription: borough.description,
    venues: venueItems,
    totalMovies: boroughMovieIds.size,
    neighborBoroughs,
    filmClubs: [],
    festivals: [],
    accessibilityStats: [],
  };
}

function BoroughDetailWithRealData() {
  return (
    <StoryDataLoader<BoroughDetailData>
      loader={loadBoroughDetailData}
      loadingMessage="Loading borough data..."
    >
      {(data) => (
        <BoroughPageContent
          boroughName={data.boroughName}
          boroughSlug={data.boroughSlug}
          boroughDescription={data.boroughDescription}
          venues={data.venues}
          totalMovies={data.totalMovies}
          neighborBoroughs={data.neighborBoroughs}
          filmClubs={data.filmClubs}
          festivals={data.festivals}
          accessibilityStats={data.accessibilityStats}
        />
      )}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Borough Detail",
  component: BoroughDetailWithRealData,
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
} satisfies Meta<typeof BoroughDetailWithRealData>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Borough detail page in loading state - data is still being
 * fetched and a loading indicator is shown.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: loadingHandlers,
    },
  },
};

/**
 * Hackney borough detail page fully loaded with venue list,
 * type tags, film counts, and nearby borough links.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};
