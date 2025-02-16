import type { Metadata } from "next";
import type { CinemaData } from "@/types";
import { type Compressed, decompress } from "compress-json";
import slugify from "@sindresorhus/slugify";
import MoviePageContent from "./content";

export async function generateStaticParams() {
  const compressedData = await import(
    "../../../../../public/combined-data.json",
    { with: { type: "json" } }
  );
  const data = decompress(compressedData.default as Compressed) as CinemaData;
  const movies = Object.values(data.movies);
  return movies.map(({ id, title }) => ({ id, slug: slugify(title) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  const compressedData = await import(
    "../../../../../public/combined-data.json",
    { with: { type: "json" } }
  );
  const data = decompress(compressedData.default as Compressed) as CinemaData;
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
