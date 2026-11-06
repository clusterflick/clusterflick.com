import type { Meta, StoryObj } from "@storybook/react";
import CinemaGroupsPageContent from "@/app/cinema-groups/page-content";
import {
  getCinemaGroupsIndex,
  type CinemaGroupsIndex,
} from "@/utils/get-cinema-groups-index";
import { groupVenuesByGroup } from "@/utils/get-venue-group-venues";
import type { Venue } from "@/types";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

/**
 * Cinema Groups Index Page Stories
 *
 * Uses real data from public/data files, through the same
 * `getCinemaGroupsIndex` the page builds with.
 */

// Hardcoded logo paths (normally resolved from the filesystem at build time)
const GROUP_IMAGE_PATHS: Record<string, string> = {
  picturehouse: "/images/venues/picturehouse.jpg",
  everyman: "/images/venues/everyman.jpg",
  curzon: "/images/venues/curzon.png",
  odeon: "/images/venues/odeon.jpg",
  vue: "/images/venues/vue.png",
  cineworld: "/images/venues/cineworld.svg",
  bfi: "/images/venues/bfi.png",
  "olympic-studios": "/images/venues/olympic-studios.png",
  "rooftop-cinema-club": "/images/venues/rooftop-cinema-club.png",
  "castle-cinema": "/images/venues/castle-cinema.png",
  "electric-cinema": "/images/venues/electric-cinema.png",
};

type CinemaGroupsPageData = CinemaGroupsIndex;

async function loadCinemaGroupsData(): Promise<CinemaGroupsPageData | null> {
  const metaData = await fetchMetaData();

  const venues: Record<string, Venue> = {};
  for (const [id, venue] of Object.entries(metaData.venues)) {
    venues[id] = { ...venue, id };
  }

  const movies = await fetchAllMovies(metaData);
  // The week counted from the dataset's first showing, so the story shows a
  // full week whenever its data was downloaded.
  const now = Math.min(
    ...Object.values(movies).flatMap((movie) =>
      movie.performances.map((performance) => performance.time),
    ),
  );

  return getCinemaGroupsIndex({ movies, venues }, groupVenuesByGroup(venues), {
    now,
    getImagePath: (slug) => GROUP_IMAGE_PATHS[slug] ?? null,
  });
}

function CinemaGroupsPageWithRealData() {
  return (
    <StoryDataLoader<CinemaGroupsPageData>
      loader={loadCinemaGroupsData}
      loadingMessage="Loading cinema groups..."
    >
      {(data) => <CinemaGroupsPageContent {...data} />}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Cinema Groups",
  component: CinemaGroupsPageWithRealData,
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
} satisfies Meta<typeof CinemaGroupsPageWithRealData>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The page while its data is still being fetched. */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: loadingHandlers,
    },
  },
};

/**
 * Fully loaded: a card per chain with something on, leading with the films
 * only it is showing, and the chains with nothing on named beneath.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};
