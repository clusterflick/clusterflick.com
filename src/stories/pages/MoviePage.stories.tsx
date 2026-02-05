import { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { decompress } from "compress-json";
import PageContent from "@/app/movies/[id]/[slug]/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import LoadingIndicator from "@/components/loading-indicator";
import { Category } from "@/types";
import type {
  Movie,
  Genre,
  Person,
  Venue,
  MetaData,
  CinemaData,
} from "@/types";
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

// Fetch and decompress real data
async function fetchRealData(
  movieFinder?: (movies: CinemaData["movies"]) => Movie | null,
): Promise<{
  metaData: MetaData;
  movies: CinemaData["movies"];
} | null> {
  try {
    // Fetch metadata
    const metaFilename = process.env.NEXT_PUBLIC_DATA_FILENAME;
    if (!metaFilename) return null;

    const metaResponse = await fetch(`/data/${metaFilename}`);
    const metaCompressed = await metaResponse.json();
    const metaData = decompress(metaCompressed) as MetaData;

    // If a finder is provided, search across files until we find a match
    if (movieFinder) {
      for (const filename of metaData.filenames) {
        const moviesResponse = await fetch(`/data/${filename}`);
        const moviesCompressed = await moviesResponse.json();
        const movies = decompress(moviesCompressed) as CinemaData["movies"];

        // Add IDs to movies
        Object.keys(movies).forEach((id) => {
          movies[id].id = id;
        });

        // Check if this file has a matching movie
        const found = movieFinder(movies);
        if (found) {
          return { metaData, movies };
        }
      }
      // No match found in any file
      return { metaData, movies: {} };
    }

    // Default: just fetch first file
    const firstFilename = metaData.filenames[0];
    const moviesResponse = await fetch(`/data/${firstFilename}`);
    const moviesCompressed = await moviesResponse.json();
    const movies = decompress(moviesCompressed) as CinemaData["movies"];

    // Add IDs to movies
    Object.keys(movies).forEach((id) => {
      movies[id].id = id;
    });

    return { metaData, movies };
  } catch (error) {
    console.error("Failed to fetch real data:", error);
    return null;
  }
}

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

// Component that loads real data and renders PageContent
function MoviePageWithRealData({
  movieFinder,
}: {
  movieFinder: (movies: CinemaData["movies"]) => Movie | null;
}) {
  const [data, setData] = useState<MoviePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pass movieFinder to fetchRealData so it can search across all files
    fetchRealData(movieFinder).then((result) => {
      if (!result) {
        setError("Failed to load data");
        setLoading(false);
        return;
      }

      const movie = movieFinder(result.movies);
      if (!movie) {
        setError("No matching movie found in data");
        setLoading(false);
        return;
      }

      const pageData = extractMoviePageData(movie, result.metaData);
      setData(pageData);
      setLoading(false);
    });
  }, [movieFinder]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#010013",
        }}
      >
        <LoadingIndicator message="Loading movie data..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#010013",
          color: "#fff",
        }}
      >
        {error || "No data available"}
      </div>
    );
  }

  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <PageContent
            movie={data.movie}
            genres={data.genres}
            people={data.people}
            venues={data.venues}
            containingEvents={data.containingEvents}
          />
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

// Movie finders for different story types
const findSingleMovie = (movies: CinemaData["movies"]) =>
  findMovie(
    movies,
    (m) =>
      // Find a movie with poster, ratings, and actors
      !!m.posterPath &&
      !!m.imdb?.rating &&
      !!m.actors?.length &&
      Object.values(m.showings).some((s) => s.category === Category.Movie),
  );

const findEventWithIncludedMovies = (movies: CinemaData["movies"]) =>
  findMovie(
    movies,
    // Find any event with included films (double feature, marathon, etc.)
    (m) => !!m.includedMovies && m.includedMovies.length > 1,
  );

// Default component
function DefaultMoviePage() {
  return <MoviePageWithRealData movieFinder={findSingleMovie} />;
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
  render: () => (
    <MoviePageWithRealData movieFinder={findEventWithIncludedMovies} />
  ),
  parameters: {
    msw: {
      handlers,
    },
  },
};
