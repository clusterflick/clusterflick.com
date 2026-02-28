import type { Meta, StoryObj } from "@storybook/react";
import FilmClubsPageContent from "@/app/film-clubs/page-content";
import type { FilmClubListItem } from "@/app/film-clubs/page";
import { FILM_CLUBS } from "@/data/film-clubs";
import { getFilmClubCurrentMovies } from "@/utils/get-film-club-movies";
import { getFilmClubUrl } from "@/utils/get-film-club-url";
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
  "arabic-cinema-club": "/images/film-clubs/arabic-cinema-club.jpg",
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
  activeClubs: FilmClubListItem[];
  inactiveClubs: FilmClubListItem[];
  activeCount: number;
  totalCount: number;
};

async function loadFilmClubsListData(): Promise<FilmClubsListData> {
  const metaData = await fetchMetaData();
  const allMovies = await fetchAllMovies(metaData);

  const filmClubItems: FilmClubListItem[] = FILM_CLUBS.map((club) => {
    const currentMovies = getFilmClubCurrentMovies(club, allMovies);
    return {
      id: club.id,
      name: club.name,
      href: getFilmClubUrl(club),
      imagePath: FILM_CLUB_IMAGE_PATHS[club.id] ?? null,
      movieCount: Object.keys(currentMovies).length,
      seoDescription: null,
    };
  });

  const activeClubs = filmClubItems
    .filter((c) => c.movieCount > 0)
    .sort(
      (a, b) => b.movieCount - a.movieCount || a.name.localeCompare(b.name),
    );
  const inactiveClubs = filmClubItems
    .filter((c) => c.movieCount === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    activeClubs,
    inactiveClubs,
    activeCount: activeClubs.length,
    totalCount: filmClubItems.length,
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
 * Film clubs list page fully loaded, split into "Currently showing"
 * and "All clubs" sections based on whether each club has active
 * screenings in the current dataset.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};

/**
 * Film clubs list page with no active screenings — all clubs appear
 * in the grid with "No films currently showing" (e.g. outside the
 * normal screening season or with an empty dataset).
 */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: emptyHandlers,
    },
  },
};
