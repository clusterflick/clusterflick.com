import type { Meta, StoryObj } from "@storybook/react";
import EventDetailPageContent from "@/components/event-detail-page-content";
import type { EventDetailPageContentProps } from "@/components/event-detail-page-content";
import FestivalBlurb from "@/components/festivals/london-soundtrack-festival";
import { FESTIVALS } from "@/data/festivals";
import { getFestivalMovies } from "@/utils/get-festival-movies";
import { getFestivalUrl } from "@/utils/get-festival-url";
import type { Movie } from "@/types";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

/**
 * Festival Detail Page Stories (London Soundtrack Festival)
 *
 * Uses real data from public/data files. The festival image path and
 * blurb component are hardcoded since those are resolved via Node.js
 * filesystem APIs at build time.
 */

const FESTIVAL_ID = "london-soundtrack-festival";
const FESTIVAL_IMAGE_PATH = `/images/festivals/${FESTIVAL_ID}.jpg`;

type FestivalDetailData = Omit<EventDetailPageContentProps, "Blurb">;

async function loadFestivalDetailData(): Promise<FestivalDetailData | null> {
  const festival = FESTIVALS.find((f) => f.id === FESTIVAL_ID);
  if (!festival) return null;

  const metaData = await fetchMetaData();
  const allMovies = await fetchAllMovies(metaData);

  const festivalMovies = getFestivalMovies(festival, allMovies);

  let movieCount = 0;
  let performanceCount = 0;
  const festivalMovieList: { movie: Movie; performanceCount: number }[] = [];

  for (const movie of Object.values(festivalMovies)) {
    movieCount++;
    const perfCount = movie.performances.length;
    performanceCount += perfCount;
    festivalMovieList.push({ movie, performanceCount: perfCount });
  }

  festivalMovieList.sort((a, b) => {
    if (b.performanceCount !== a.performanceCount) {
      return b.performanceCount - a.performanceCount;
    }
    return a.movie.title.localeCompare(b.movie.title);
  });

  const GRID_MOVIE_LIMIT = 72;
  const gridMovies = festivalMovieList.slice(0, GRID_MOVIE_LIMIT);
  const gridMoviesTruncated = festivalMovieList.length > GRID_MOVIE_LIMIT;

  return {
    name: festival.name,
    url: festival.url,
    imagePath: FESTIVAL_IMAGE_PATH,
    movieCount,
    performanceCount,
    backUrl: "/festivals",
    backText: "All festivals",
    gridMovies,
    gridMoviesTruncated,
    isAlias: false,
    canonicalUrl: getFestivalUrl(festival),
    venues: [],
  };
}

function FestivalDetailWithRealData() {
  return (
    <StoryDataLoader<FestivalDetailData>
      loader={loadFestivalDetailData}
      loadingMessage="Loading festival data..."
    >
      {(data) => <EventDetailPageContent {...data} Blurb={FestivalBlurb} />}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Festival Detail",
  component: FestivalDetailWithRealData,
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
} satisfies Meta<typeof FestivalDetailWithRealData>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Festival detail page in loading state — data is still being fetched
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
 * London Soundtrack Festival detail page fully loaded with the festival
 * logo, about blurb, and a grid of films from the festival.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};
