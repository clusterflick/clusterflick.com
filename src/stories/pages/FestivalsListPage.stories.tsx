import type { Meta, StoryObj } from "@storybook/react";
import FestivalsPageContent from "@/app/festivals/page-content";
import type { FestivalListItem } from "@/app/festivals/page";
import { FESTIVALS } from "@/data/festivals";
import {
  getFestivalMovies,
  getFestivalDateRange,
} from "@/utils/get-festival-movies";
import { getFestivalUrl } from "@/utils/get-festival-url";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import {
  handlers,
  loadingHandlers,
  emptyHandlers,
} from "../../../.storybook/msw/handlers";

/**
 * Festivals List Page Stories
 *
 * Uses real data from public/data files. Festival image paths are
 * hardcoded since those are resolved via Node.js filesystem APIs at
 * build time.
 */

// Hardcoded image paths (normally resolved from filesystem at build time)
const FESTIVAL_IMAGE_PATHS: Record<string, string> = {
  "festival-of-creativity-gothic-film-festival":
    "/images/festivals/festival-of-creativity-gothic-film-festival.png",
  "london-soundtrack-festival":
    "/images/festivals/london-soundtrack-festival.jpg",
  "judgement-hall-festival": "/images/festivals/judgement-hall-festival.jpg",
  "london-fetish-film-festival":
    "/images/festivals/london-fetish-film-festival.jpg",
  "animation-in-love": "/images/festivals/animation-in-love.jpg",
};

async function loadFestivalsListData(): Promise<FestivalListItem[]> {
  const metaData = await fetchMetaData();
  const allMovies = await fetchAllMovies(metaData);

  return FESTIVALS.flatMap((festival) => {
    const movies = getFestivalMovies(festival, allMovies);
    if (Object.keys(movies).length === 0) return [];

    const { dateFrom, dateTo } = getFestivalDateRange(movies);
    return [
      {
        id: festival.id,
        name: festival.name,
        href: getFestivalUrl(festival),
        imagePath: FESTIVAL_IMAGE_PATHS[festival.id] ?? null,
        movieCount: Object.keys(movies).length,
        dateFrom,
        dateTo,
      },
    ];
  });
}

function FestivalsListWithRealData() {
  return (
    <StoryDataLoader<FestivalListItem[]>
      loader={loadFestivalsListData}
      loadingMessage="Loading festivals..."
    >
      {(festivals) => <FestivalsPageContent festivals={festivals} />}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Festivals List",
  component: FestivalsListWithRealData,
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
} satisfies Meta<typeof FestivalsListWithRealData>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Festivals list page in loading state — data is still being fetched
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
 * Festivals list page fully loaded with all festivals that have
 * matching films in the current dataset.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};

/**
 * Festivals list page with no matching festivals — shown when no films
 * in the dataset match any festival's criteria (e.g. outside the
 * festival season).
 */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: emptyHandlers,
    },
  },
};
