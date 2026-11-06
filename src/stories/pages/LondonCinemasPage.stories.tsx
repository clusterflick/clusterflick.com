import type { Meta, StoryObj } from "@storybook/react";
import LondonCinemasPageContent from "@/app/london-cinemas/page-content";
import type { BoroughListItem } from "@/app/london-cinemas/page";
import {
  getBoroughWeek,
  type BoroughWeek,
} from "@/app/london-cinemas/get-borough-week";
import { formatDateLong } from "@/utils/format-date";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { getBoroughUrl } from "@/utils/get-borough-url";
import type { Venue } from "@/types";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import { groupVenuesByBoroughSimple } from "../utils/group-venues-by-borough-simple";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

/**
 * London Cinemas by Borough Page Stories
 *
 * Uses real data from public/data files. Groups venues by London
 * borough using a simple center+radius approximation (the real pages
 * use GeoJSON boundary data which requires Node.js fs access).
 */

type LondonCinemasPageData = BoroughWeek & {
  boroughs: BoroughListItem[];
  totalBoroughs: number;
  countedOn: string;
};

async function loadLondonCinemasData(): Promise<LondonCinemasPageData | null> {
  const metaData = await fetchMetaData();

  const venues: Record<string, Venue> = {};
  for (const [id, venue] of Object.entries(metaData.venues)) {
    venues[id] = { ...venue, id };
  }

  const venuesByBorough = groupVenuesByBoroughSimple(venues);
  const movies = await fetchAllMovies(metaData);
  // The week counted from the dataset's first showing, so the story shows a
  // full week whenever its data was downloaded.
  const now = Math.min(
    ...Object.values(movies).flatMap((movie) =>
      movie.performances.map((performance) => performance.time),
    ),
  );

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

  return {
    boroughs,
    totalBoroughs: boroughs.length,
    ...getBoroughWeek({ movies, venues }, venuesByBorough, now),
    countedOn: formatDateLong(now),
  };
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
          map={data.map}
          week={data.week}
          countedOn={data.countedOn}
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
 * London Cinemas page fully loaded: the map of films showing in each
 * borough, the same figures ranked, and every borough with venues A–Z.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};
