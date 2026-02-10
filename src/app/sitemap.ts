import { type MetadataRoute } from "next";
import slugify from "@sindresorhus/slugify";
import { getStaticData } from "@/utils/get-static-data";
import { Movie, Venue } from "@/types";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getStaticData();

  const moviePages = Object.values(data.movies).map((movie: Movie) => ({
    url: `https://clusterflick.com/movies/${movie.id}/${slugify(movie.title)}`,
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const venuePages = Object.values(data.venues).map((venue: Venue) => ({
    url: `https://clusterflick.com/venues/${slugify(venue.name)}`,
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const staticPages = [
    {
      url: "https://clusterflick.com",
      lastModified: data.generatedAt,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: "https://clusterflick.com/about",
      lastModified: data.generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: "https://clusterflick.com/venues",
      lastModified: data.generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ];

  return [...staticPages, ...moviePages, ...venuePages];
}
