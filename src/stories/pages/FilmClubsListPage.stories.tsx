import type { Meta, StoryObj } from "@storybook/react";
import FilmClubsPageContent from "@/app/film-clubs/page-content";
import {
  getFilmClubsIndex,
  type FilmClubListItem,
} from "@/utils/get-film-clubs-index";
import { FILM_CLUBS } from "@/data/film-clubs";
import type { PosterRowItem } from "@/components/poster-row";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import {
  handlers,
  loadingHandlers,
  emptyHandlers,
} from "../../../.storybook/msw/handlers";

/**
 * Film Clubs List Page Stories
 *
 * Uses real data from public/data files. Film club image paths are
 * hardcoded since those are resolved via Node.js filesystem APIs at
 * build time.
 */

// Hardcoded image paths (normally resolved from filesystem at build time)
const FILM_CLUB_IMAGE_PATHS: Record<string, string> = {
  "acton-film-club": "/images/film-clubs/acton-film-club.jpg",
  "arab-film-club": "/images/film-clubs/arab-film-club.jpg",
  "bar-trash": "/images/film-clubs/bar-trash.jpg",
  "bloody-mary-film-club": "/images/film-clubs/bloody-mary-film-club.png",
  "bounce-cinema": "/images/film-clubs/bounce-cinema.png",
  "category-h-film-club": "/images/film-clubs/category-h-film-club.jpg",
  cinebug: "/images/film-clubs/cinebug.jpg",
  "distorted-frame": "/images/film-clubs/distorted-frame.jpg",
  ghibliotheque: "/images/film-clubs/ghibliotheque.jpg",
  "gothique-film-society": "/images/film-clubs/gothique-film-society.png",
  "japanese-film-club": "/images/film-clubs/japanese-film-club.svg",
  "kung-fu-cinema": "/images/film-clubs/kung-fu-cinema.jpg",
  "lost-reels": "/images/film-clubs/lost-reels.jpg",
  "new-east-cinema": "/images/film-clubs/new-east-cinema.jpg",
  "pitchblack-playback": "/images/film-clubs/pitchblack-playback.jpg",
  "queer-horror-nights": "/images/film-clubs/queer-horror-nights.jpg",
  "rebel-reel": "/images/film-clubs/rebel-reel.jpg",
  "richmond-film-society": "/images/film-clubs/richmond-film-society.png",
  "rio-feminist-film-group": "/images/film-clubs/rio-feminist-film-group.jpg",
  supakino: "/images/film-clubs/supakino.jpg",
  "violet-hour": "/images/film-clubs/violet-hour.jpg",
  "wimbledon-film-club": "/images/film-clubs/wimbledon-film-club.jpg",
};

type FilmClubsListData = {
  nextUp: PosterRowItem[];
  activeClubs: FilmClubListItem[];
  inactiveClubs: FilmClubListItem[];
  activeCount: number;
  totalCount: number;
};

async function loadFilmClubsListData(): Promise<FilmClubsListData> {
  const metaData = await fetchMetaData();
  const allMovies = await fetchAllMovies(metaData);
  const { nextUp, activeClubs, inactiveClubs } = getFilmClubsIndex(allMovies, {
    getImagePath: (id) => FILM_CLUB_IMAGE_PATHS[id] ?? null,
  });

  return {
    nextUp,
    activeClubs,
    inactiveClubs,
    activeCount: activeClubs.length,
    totalCount: FILM_CLUBS.length,
  };
}

function FilmClubsListWithRealData() {
  return (
    <StoryDataLoader<FilmClubsListData>
      loader={loadFilmClubsListData}
      loadingMessage="Loading film clubs..."
    >
      {(data) => (
        <FilmClubsPageContent
          nextUp={data.nextUp}
          activeClubs={data.activeClubs}
          inactiveClubs={data.inactiveClubs}
          activeCount={data.activeCount}
          totalCount={data.totalCount}
        />
      )}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Film Clubs List",
  component: FilmClubsListWithRealData,
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
} satisfies Meta<typeof FilmClubsListWithRealData>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Film clubs list page in loading state — data is still being fetched
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
 * Film clubs list page fully loaded: a "Next up" row of each club's next
 * screening, the clubs showing films grouped by kind, and the rest as a
 * compact list of names.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};

/**
 * Film clubs list page with no active screenings — no "Next up" row, and
 * every club listed by name under "All clubs".
 */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: emptyHandlers,
    },
  },
};
