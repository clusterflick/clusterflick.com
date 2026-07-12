import { type MetadataRoute } from "next";
import slugify from "@sindresorhus/slugify";
import { getStaticData } from "@/utils/get-static-data";
import { Movie, Venue } from "@/types";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { groupVenuesByBorough } from "@/utils/get-borough-venues";
import { FESTIVALS } from "@/data/festivals";
import { getFestivalUrl } from "@/utils/get-festival-url";
import { FILM_CLUBS } from "@/data/film-clubs";
import { getFilmClubUrl } from "@/utils/get-film-club-url";
import { VENUE_GROUPS } from "@/data/venue-groups";
import { getVenueGroupUrl } from "@/utils/get-venue-group-url";
import { groupVenuesByGroup } from "@/utils/get-venue-group-venues";
import { GENRES } from "@/data/genres";
import { getGenreUrl } from "@/utils/get-genre-url";
import { FORMATS } from "@/data/formats";
import { getFormatUrl } from "@/utils/get-format-url";

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
    priority: 0.6,
  }));

  const venuesByBorough = groupVenuesByBorough(data.venues);

  const boroughPages = LONDON_BOROUGHS.filter((b) =>
    venuesByBorough.has(b.slug),
  ).map((b) => ({
    url: `https://clusterflick.com/london-cinemas/${b.slug}`,
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const festivalListPage = {
    url: "https://clusterflick.com/festivals",
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const festivalPages = FESTIVALS.map((festival) => ({
    url: `https://clusterflick.com${getFestivalUrl(festival)}`,
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const filmClubListPage = {
    url: "https://clusterflick.com/film-clubs",
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  };

  const filmClubPages = FILM_CLUBS.map((club) => ({
    url: `https://clusterflick.com${getFilmClubUrl(club)}`,
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const cinemaGroupListPage = {
    url: "https://clusterflick.com/cinema-groups",
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  };

  const genreListPage = {
    url: "https://clusterflick.com/genres",
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const genrePages = GENRES.map((genre) => ({
    url: `https://clusterflick.com${getGenreUrl(genre)}`,
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const formatListPage = {
    url: "https://clusterflick.com/formats",
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const formatPages = FORMATS.map((format) => ({
    url: `https://clusterflick.com${getFormatUrl(format)}`,
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const venuesByGroup = groupVenuesByGroup(data.venues);

  const cinemaGroupPages = VENUE_GROUPS.filter((group) =>
    venuesByGroup.has(group.slug),
  ).map((group) => ({
    url: `https://clusterflick.com${getVenueGroupUrl(group)}`,
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const staticPages = [
    {
      url: "https://clusterflick.com",
      lastModified: data.generatedAt,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: "https://clusterflick.com/films",
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
      url: "https://clusterflick.com/accessibility",
      lastModified: data.generatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: "https://clusterflick.com/changelog",
      lastModified: data.generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: "https://clusterflick.com/venues",
      lastModified: data.generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: "https://clusterflick.com/london-cinemas",
      lastModified: data.generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ];

  return [
    ...staticPages,
    festivalListPage,
    filmClubListPage,
    cinemaGroupListPage,
    genreListPage,
    ...genrePages,
    formatListPage,
    ...formatPages,
    ...moviePages,
    ...venuePages,
    ...boroughPages,
    ...festivalPages,
    ...filmClubPages,
    ...cinemaGroupPages,
  ];
}
