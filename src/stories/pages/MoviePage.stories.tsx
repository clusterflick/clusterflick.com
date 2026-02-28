import type { Meta, StoryObj } from "@storybook/react";
import PageContent from "@/app/movies/[id]/[slug]/page-content";
import { Category } from "@/types";
import type {
  Movie,
  Genre,
  Person,
  Venue,
  MetaData,
  CinemaData,
} from "@/types";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

/**
 * Movie Detail Page Stories
 *
 * Uses real data from public/data files. The component fetches and
 * decompresses the actual data to render movie detail pages.
 */

type MoviePageData = {
  movie: Omit<Movie, "performances">;
  genres: Record<string, Genre>;
  people: Record<string, Person>;
  venues: Record<string, Venue>;
  containingEvents: Omit<Movie, "performances">[];
};

// Find a movie matching criteria
function findMovie(
  movies: CinemaData["movies"],
  predicate: (movie: Movie) => boolean,
): Movie | null {
  for (const movie of Object.values(movies)) {
    if (predicate(movie)) return movie;
  }
  return null;
}

// Extract props for PageContent from real data
function extractMoviePageData(movie: Movie, metaData: MetaData): MoviePageData {
  // Get relevant genres
  const genres: Record<string, Genre> = {};
  if (movie.genres) {
    for (const genreId of movie.genres) {
      if (metaData.genres[genreId]) {
        genres[genreId] = { ...metaData.genres[genreId], id: genreId };
      }
    }
  }

  // Get relevant people
  const people: Record<string, Person> = {};
  if (movie.directors) {
    for (const personId of movie.directors) {
      if (metaData.people[personId]) {
        people[personId] = { ...metaData.people[personId], id: personId };
      }
    }
  }
  if (movie.actors) {
    for (const personId of movie.actors) {
      if (metaData.people[personId]) {
        people[personId] = { ...metaData.people[personId], id: personId };
      }
    }
  }

  // Get relevant venues
  const venues: Record<string, Venue> = {};
  for (const showing of Object.values(movie.showings)) {
    if (metaData.venues[showing.venueId]) {
      venues[showing.venueId] = {
        ...metaData.venues[showing.venueId],
        id: showing.venueId,
      };
    }
  }

  // Exclude performances for the movie prop
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { performances: _performances, ...movieWithoutPerformances } = movie;

  return {
    movie: movieWithoutPerformances,
    genres,
    people,
    venues,
    containingEvents: [],
  };
}

// Loader for a single movie with full metadata
async function loadSingleMovieData(): Promise<MoviePageData | null> {
  const metaData = await fetchMetaData();
  const movies = await fetchAllMovies(metaData);

  const movie = findMovie(
    movies,
    (m) =>
      !!m.posterPath &&
      !!m.imdb?.rating &&
      !!m.actors?.length &&
      Object.values(m.showings).some((s) => s.category === Category.Movie),
  );

  if (!movie) return null;
  return extractMoviePageData(movie, metaData);
}

// Loader for an event with included films
async function loadEventWithIncludedMoviesData(): Promise<MoviePageData | null> {
  const metaData = await fetchMetaData();
  const movies = await fetchAllMovies(metaData);

  const movie = findMovie(
    movies,
    (m) => !!m.includedMovies && m.includedMovies.length > 1,
  );

  if (!movie) return null;
  return extractMoviePageData(movie, metaData);
}

function DefaultMoviePage() {
  return (
    <StoryDataLoader<MoviePageData>
      loader={loadSingleMovieData}
      loadingMessage="Loading movie data..."
    >
      {(data) => (
        <PageContent
          movie={data.movie}
          genres={data.genres}
          people={data.people}
          venues={data.venues}
          containingEvents={data.containingEvents}
          festivals={[]}
        />
      )}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Movie Detail",
  component: DefaultMoviePage,
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
} satisfies Meta<typeof DefaultMoviePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Movie detail page in loading state - hero content is visible
 * but showings are still being fetched.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: loadingHandlers,
    },
  },
};

/**
 * A single movie with full metadata including poster, ratings,
 * cast, and multiple showings across venues.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};

/**
 * An event with included films (e.g., double feature, marathon)
 * showing stacked posters and included films.
 */
export const WithIncludedMovies: Story = {
  args: {},
  render: () => (
    <StoryDataLoader<MoviePageData>
      loader={loadEventWithIncludedMoviesData}
      loadingMessage="Loading movie data..."
    >
      {(data) => (
        <PageContent
          movie={data.movie}
          genres={data.genres}
          people={data.people}
          venues={data.venues}
          containingEvents={data.containingEvents}
          festivals={[]}
        />
      )}
    </StoryDataLoader>
  ),
  parameters: {
    msw: {
      handlers,
    },
  },
};
