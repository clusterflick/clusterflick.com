import type { Metadata } from "next";
import slugify from "@sindresorhus/slugify";
import getData from "@/utils/get-data";
import MoviePageContent from "./content";

export async function generateStaticParams() {
  const data = await getData();
  const movies = Object.values(data.movies);
  return movies.map(({ id, title }) => ({ id, slug: slugify(title) }));
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
    title: `${movie.title} ${movie.year ? `(${movie.year})` : ""} - Performances`,
  };
}

export default function MoviePage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  return <MoviePageContent params={params} />;
}
