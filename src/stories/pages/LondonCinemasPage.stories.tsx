import type { Meta, StoryObj } from "@storybook/react";
import LondonCinemasPageContent from "@/app/london-cinemas/page-content";
import type { BoroughListItem } from "@/app/london-cinemas/page";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { groupVenuesByBorough } from "@/utils/get-borough-venues";
import { getBoroughUrl } from "@/utils/get-borough-url";
import type { Venue } from "@/types";
import { fetchMetaData } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

/**
 * London Cinemas by Borough Page Stories
 *
 * Uses real data from public/data files. Groups venues by London
 * borough using the center+radius approximation and displays
 * the borough listing page.
 */

type LondonCinemasPageData = {
  boroughs: BoroughListItem[];
  totalBoroughs: number;
};

async function loadLondonCinemasData(): Promise<LondonCinemasPageData | null> {
  const metaData = await fetchMetaData();

  const venues: Record<string, Venue> = {};
  for (const [id, venue] of Object.entries(metaData.venues)) {
    venues[id] = { ...venue, id };
  }

  const venuesByBorough = groupVenuesByBorough(venues);

  const boroughs: BoroughListItem[] = LONDON_BOROUGHS.filter((b) =>
    venuesByBorough.has(b.slug),
  )
    .map((b) => ({
      name: b.name,
      slug: b.slug,
      href: getBoroughUrl(b),
      venueCount: venuesByBorough.get(b.slug)!.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { boroughs, totalBoroughs: boroughs.length };
}

function LondonCinemasPageWithRealData() {
  return (
    <StoryDataLoader<LondonCinemasPageData>
      loader={loadLondonCinemasData}
      loadingMessage="Loading borough data..."
    >
      {(data) => (
        <LondonCinemasPageContent
          boroughs={data.boroughs}
          totalBoroughs={data.totalBoroughs}
        />
      )}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/London Cinemas",
  component: LondonCinemasPageWithRealData,
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
} satisfies Meta<typeof LondonCinemasPageWithRealData>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * London Cinemas page in loading state - data is still being
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
 * London Cinemas page fully loaded with all boroughs that have
 * venues displayed in an alphabetical grid with venue counts.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};
