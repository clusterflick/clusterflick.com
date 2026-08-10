import type { Meta, StoryObj } from "@storybook/react";
import DepartedContent from "@/app/movies/[id]/[slug]/departed-content";
import type { Genre, Movie, Person, MetaData } from "@/types";
import type { DepartedMovie } from "@/utils/get-departed-data";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers } from "../../../.storybook/msw/handlers";

/**
 * Departed Movie Page Stories
 *
 * The page a film gets once its run has ended. There is no departed bundle in
 * a dev checkout — it is published by data-combined and only exists in CI — so
 * these stories build one from a film that *is* currently showing, dropping
 * its showings and performances exactly as the real bundle does. That makes
 * this the way to see the page without a full pipeline run.
 */

type DepartedPageData = {
  movie: DepartedMovie;
  genres: Record<string, Genre>;
  people: Record<string, Person>;
  buildTime: number;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Turn a showing film into the record the departed bundle would hold for it.
 * The real bundle is rebuilt from TheMovieDB through the same builder the
 * combined data uses, so everything here survives except where and when to
 * watch it.
 */
function asDeparted(
  movie: Movie,
  metaData: MetaData,
  lastPerformance?: number,
  stillListedAs?: { id: string; title: string },
): DepartedPageData {
  const genres: Record<string, Genre> = {};
  for (const genreId of movie.genres ?? []) {
    if (metaData.genres[genreId]) {
      genres[genreId] = { ...metaData.genres[genreId], id: genreId };
    }
  }

  const people: Record<string, Person> = {};
  for (const personId of [
    ...(movie.directors ?? []),
    ...(movie.actors ?? []),
  ]) {
    if (metaData.people[personId]) {
      people[personId] = { ...metaData.people[personId], id: personId };
    }
  }

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    showings: _showings,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    performances: _performances,
    ...rest
  } = movie;

  return {
    movie: {
      ...rest,
      lastSeen: "20260801.055209",
      lastPerformance,
      stillListedAs,
    },
    genres,
    people,
    buildTime: Date.now(),
  };
}

async function findFilm(): Promise<Movie | null> {
  const metaData = await fetchMetaData();
  const movies = await fetchAllMovies(metaData);

  for (const movie of Object.values(movies)) {
    if (
      !movie.isUnmatched &&
      movie.posterPath &&
      movie.overview &&
      movie.directors?.length &&
      movie.actors?.length
    ) {
      return movie;
    }
  }
  return null;
}

async function loadDepartedData(): Promise<DepartedPageData | null> {
  const metaData = await fetchMetaData();
  const movie = await findFilm();
  if (!movie) return null;
  return asDeparted(movie, metaData, Date.now() - 9 * DAY);
}

/**
 * A film we never recorded a performance time for — the registry entry has no
 * `lastPerformance`, so the status line has to stand on its own.
 */
async function loadUndatedDepartedData(): Promise<DepartedPageData | null> {
  const metaData = await fetchMetaData();
  const movie = await findFilm();
  if (!movie) return null;
  return asDeparted(movie, metaData);
}

/**
 * The film lost its TheMovieDB match rather than its screenings, and an
 * unmatched listing under the same title is still on. `lastPerformance` sits in
 * the future here, as it does whenever this happens — the screening it names
 * has not been and gone.
 */
async function loadStillListedData(): Promise<DepartedPageData | null> {
  const metaData = await fetchMetaData();
  const movie = await findFilm();
  if (!movie) return null;
  return asDeparted(movie, metaData, Date.now() + 60 * DAY, {
    id: "7fc1f2ab",
    title: `${movie.title} (U)`,
  });
}

function DepartedMoviePage() {
  return (
    <StoryDataLoader<DepartedPageData>
      loader={loadDepartedData}
      loadingMessage="Loading movie data..."
    >
      {(data) => (
        <DepartedContent
          movie={data.movie}
          genres={data.genres}
          people={data.people}
          buildTime={data.buildTime}
        />
      )}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Movie Detail (Departed)",
  component: DepartedMoviePage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    msw: {
      handlers,
    },
    // The film is picked out of live data, so it changes between builds.
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof DepartedMoviePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A film that finished its run, with the date of its last screening. */
export const Default: Story = {};

/** The same page for a film with no recorded last performance. */
export const WithoutLastPerformance: Story = {
  render: () => (
    <StoryDataLoader<DepartedPageData>
      loader={loadUndatedDepartedData}
      loadingMessage="Loading movie data..."
    >
      {(data) => (
        <DepartedContent
          movie={data.movie}
          genres={data.genres}
          people={data.people}
          buildTime={data.buildTime}
        />
      )}
    </StoryDataLoader>
  ),
};

/** Lost its match, not its screenings — offers the listing that is still on. */
export const StillListedUnmatched: Story = {
  render: () => (
    <StoryDataLoader<DepartedPageData>
      loader={loadStillListedData}
      loadingMessage="Loading movie data..."
    >
      {(data) => (
        <DepartedContent
          movie={data.movie}
          genres={data.genres}
          people={data.people}
          buildTime={data.buildTime}
        />
      )}
    </StoryDataLoader>
  ),
};
