import type { Metadata } from "next";
import getData from "@/utils/get-data";
import getMovieUrlSegments from "@/utils/get-movie-url-segments";
import MoviePageContent from "./content";

export async function generateStaticParams() {
  const data = await getData();
  const movies = Object.values(data.movies);
  return movies.map(getMovieUrlSegments);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const data = await getData();
  const id = (await params).id;
  const movie = data.movies[id];
  return {
    title: `${movie.title} ${movie.year ? `(${movie.year})` : ""} on Clusterflick`,
    description:
      "Every film, every cinema, one place. Compare screenings across London and find your perfect movie night.",
  };
}

export default function MoviePage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  return <MoviePageContent params={params} />;
}
