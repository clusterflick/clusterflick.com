import type { Metadata } from "next";
import { notFound } from "next/navigation";
import slugify from "@sindresorhus/slugify";
import { getStaticData } from "@/utils/get-static-data";
import type { Genre, Person, Venue } from "@/types";
import PageContent from "./page-content";

// Only allow routes from generateStaticParams, 404 for everything else
export const dynamicParams = false;

export async function generateStaticParams() {
  const data = await getStaticData();

  return Object.values(data.movies).map((movie) => ({
    id: movie.id,
    slug: slugify(movie.title),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getStaticData();
  const movie = data.movies[id];

  if (!movie) {
    return {
      title: "Movie Not Found",
    };
  }

  const title = movie.year ? `${movie.title} (${movie.year})` : movie.title;
  const description =
    movie.overview ||
    `Find screenings for ${movie.title} at cinemas across London.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Clusterflick`,
      description,
      images: movie.posterPath
        ? [`https://image.tmdb.org/t/p/w500${movie.posterPath}`]
        : undefined,
    },
  };
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;
  const data = await getStaticData();
  const movie = data.movies[id];

  if (!movie) {
    notFound();
  }

  const genres: Record<string, Genre> = {};
  if (movie.genres) {
    for (const genreId of movie.genres) {
      if (data.genres[genreId]) {
        genres[genreId] = data.genres[genreId];
      }
    }
  }

  const people: Record<string, Person> = {};
  if (movie.directors) {
    for (const personId of movie.directors) {
      if (data.people[personId]) {
        people[personId] = data.people[personId];
      }
    }
  }
  if (movie.actors) {
    for (const personId of movie.actors) {
      if (data.people[personId]) {
        people[personId] = data.people[personId];
      }
    }
  }

  const venues: Record<string, Venue> = {};
  for (const showing of Object.values(movie.showings)) {
    if (data.venues[showing.venueId]) {
      venues[showing.venueId] = data.venues[showing.venueId];
    }
  }

  // Exclude performances from the movie object to avoid passing unnecessary data to client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { performances: _performances, ...movieWithoutPerformances } = movie;

  return (
    <PageContent
      movie={movieWithoutPerformances}
      genres={genres}
      people={people}
      venues={venues}
    />
  );
}
