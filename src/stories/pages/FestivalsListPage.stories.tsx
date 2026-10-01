import type { Meta, StoryObj } from "@storybook/react";
import FestivalsPageContent from "@/app/festivals/page-content";
import {
  getFestivalsIndex,
  type FestivalListItem,
  type FeaturedFestival,
} from "@/utils/get-festivals-index";
import { getLondonMidnightTimestamp } from "@/utils/format-date";
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
    "/images/festivals/festival-of-creativity-gothic-film-festival.jpg",
  "london-soundtrack-festival":
    "/images/festivals/london-soundtrack-festival.jpg",
  "judgement-hall-festival": "/images/festivals/judgement-hall-festival.jpg",
  "london-fetish-film-festival":
    "/images/festivals/london-fetish-film-festival.jpg",
  "animation-in-love": "/images/festivals/animation-in-love.jpg",
};

type FestivalsListData = {
  festivals: FestivalListItem[];
  featured: FeaturedFestival | null;
  now: number;
  today: number;
};

async function loadFestivalsListData(): Promise<FestivalsListData> {
  const metaData = await fetchMetaData();
  const allMovies = await fetchAllMovies(metaData);
  const now = Date.now();
  return {
    ...getFestivalsIndex(allMovies, {
      now,
      getImagePath: (id) => FESTIVAL_IMAGE_PATHS[id] ?? null,
    }),
    now,
    today: getLondonMidnightTimestamp(),
  };
}

function FestivalsListWithRealData() {
  return (
    <StoryDataLoader<FestivalsListData>
      loader={loadFestivalsListData}
      loadingMessage="Loading festivals..."
    >
      {({ festivals, featured, now, today }) => (
        <FestivalsPageContent
          festivals={festivals}
          featured={featured}
          venues={[]}
          now={now}
          today={today}
        />
      )}
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
