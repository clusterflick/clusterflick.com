import type { Meta, StoryObj } from "@storybook/react";
import EventDetailPageContent from "@/components/event-detail-page-content";
import type { EventDetailPageContentProps } from "@/components/event-detail-page-content";
import FilmClubBlurb from "@/components/film-clubs/ghibliotheque";
import { FILM_CLUBS } from "@/data/film-clubs";
import {
  getFilmClubCurrentMovies,
  getFilmClubMovies,
} from "@/utils/get-film-club-movies";
import { getFilmClubUrl } from "@/utils/get-film-club-url";
import type { Movie } from "@/types";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

/**
 * Film Club Detail Page Stories (Ghibliotheque)
 *
 * Uses real data from public/data files. The film club image path and
 * blurb component are hardcoded since those are resolved via Node.js
 * filesystem APIs at build time.
 */

const FILM_CLUB_ID = "ghibliotheque";
const FILM_CLUB_IMAGE_PATH = `/images/film-clubs/${FILM_CLUB_ID}.jpg`;

type FilmClubDetailData = Omit<EventDetailPageContentProps, "Blurb">;

async function loadFilmClubDetailData(): Promise<FilmClubDetailData | null> {
  const club = FILM_CLUBS.find((c) => c.id === FILM_CLUB_ID);
  if (!club) return null;

  const metaData = await fetchMetaData();
  const allMovies = await fetchAllMovies(metaData);

  const currentMovies = getFilmClubCurrentMovies(club, allMovies);
  const allClubMovies = getFilmClubMovies(club, allMovies);

  let movieCount = 0;
  let performanceCount = 0;
  const clubMovieList: { movie: Movie; performanceCount: number }[] = [];

  for (const movie of Object.values(currentMovies)) {
    movieCount++;
    const perfCount = movie.performances.length;
    performanceCount += perfCount;
    clubMovieList.push({ movie, performanceCount: perfCount });
  }

  clubMovieList.sort((a, b) => {
    if (b.performanceCount !== a.performanceCount) {
      return b.performanceCount - a.performanceCount;
    }
    return a.movie.title.localeCompare(b.movie.title);
  });

  const GRID_MOVIE_LIMIT = 72;
  const gridMovies = clubMovieList.slice(0, GRID_MOVIE_LIMIT);
  const gridMoviesTruncated = clubMovieList.length > GRID_MOVIE_LIMIT;

  const heroMovieCount =
    movieCount > 0 ? movieCount : Object.keys(allClubMovies).length;

  return {
    name: club.name,
    url: club.url,
    imagePath: FILM_CLUB_IMAGE_PATH,
    movieCount: heroMovieCount,
    performanceCount,
    backUrl: "/film-clubs",
    backText: "All film clubs",
    gridMovies,
    gridMoviesTruncated,
    isAlias: false,
    canonicalUrl: getFilmClubUrl(club),
    venues: [],
  };
}

function FilmClubDetailWithRealData() {
  return (
    <StoryDataLoader<FilmClubDetailData>
      loader={loadFilmClubDetailData}
      loadingMessage="Loading film club data..."
    >
      {(data) => <EventDetailPageContent {...data} Blurb={FilmClubBlurb} />}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Film Club Detail",
  component: FilmClubDetailWithRealData,
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
} satisfies Meta<typeof FilmClubDetailWithRealData>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Film club detail page in loading state — data is still being fetched
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
 * Ghibliotheque detail page fully loaded with the club logo, about
 * blurb, and a grid of films currently showing.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};
