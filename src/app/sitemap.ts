import { type MetadataRoute } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getMovieUrl } from "@/utils/get-movie-url";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getBoroughUrl } from "@/utils/get-borough-url";
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
import { MOVIE_LISTS } from "@/data/movie-lists";
import { getMovieListUrl } from "@/utils/get-movie-list-url";
import { getCollectionsData } from "@/utils/get-collections-data";
import { getCollectionUrl } from "@/utils/get-collection-url";
import { REPORTS, getReportUrl } from "@/data/reports";
import {
  buildUpdates,
  getUpdateDayPath,
  groupUpdatesByDay,
  readDiffBlobs,
} from "@/utils/get-updates";

export const dynamic = "force-static";

const SITE = "https://clusterflick.com";

// The export is built with `trailingSlash: true`, so every page is served at
// its path plus "/" — the address its canonical tag names — and the bare path
// 301s there. Listing the bare path told Google every page was a redirect.
function pageUrl(path: string): string {
  return `${SITE}${path.endsWith("/") ? path : `${path}/`}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getStaticData();

  const moviePages = Object.values(data.movies).map((movie: Movie) => ({
    url: pageUrl(getMovieUrl(movie)),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Films that have finished their run keep their pages (`getDepartedData`),
  // so links to them still land, but aren't listed — and are `noindex`: each
  // says little more than that the film has stopped showing, and they were two
  // fifths of the sitemap.

  const venuePages = Object.values(data.venues).map((venue: Venue) => ({
    url: pageUrl(getVenueUrl(venue)),
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const venuesByBorough = groupVenuesByBorough(data.venues);

  const boroughPages = LONDON_BOROUGHS.filter((b) =>
    venuesByBorough.has(b.slug),
  ).map((b) => ({
    url: pageUrl(getBoroughUrl(b)),
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const festivalListPage = {
    url: pageUrl("/festivals"),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const festivalPages = FESTIVALS.map((festival) => ({
    url: pageUrl(getFestivalUrl(festival)),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const filmClubListPage = {
    url: pageUrl("/film-clubs"),
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  };

  const filmClubPages = FILM_CLUBS.map((club) => ({
    url: pageUrl(getFilmClubUrl(club)),
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const cinemaGroupListPage = {
    url: pageUrl("/cinema-groups"),
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  };

  const genreListPage = {
    url: pageUrl("/genres"),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const genrePages = GENRES.map((genre) => ({
    url: pageUrl(getGenreUrl(genre)),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const formatListPage = {
    url: pageUrl("/formats"),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const formatPages = FORMATS.map((format) => ({
    url: pageUrl(getFormatUrl(format)),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const movieListListPage = {
    url: pageUrl("/lists"),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const movieListPages = MOVIE_LISTS.map((list) => ({
    url: pageUrl(getMovieListUrl(list)),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const collectionListPage = {
    url: pageUrl("/collections"),
    lastModified: data.generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const collectionPages = Object.values(getCollectionsData()).map(
    (collection) => ({
      url: pageUrl(getCollectionUrl(collection)),
      lastModified: data.generatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }),
  );

  const venuesByGroup = groupVenuesByGroup(data.venues);

  const cinemaGroupPages = VENUE_GROUPS.filter((group) =>
    venuesByGroup.has(group.slug),
  ).map((group) => ({
    url: pageUrl(getVenueGroupUrl(group)),
    lastModified: data.generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // A report is a fixed snapshot: it changes only if it's corrected.
  const reportPages = [
    { path: "/reports", lastModified: REPORTS[0]?.asOf },
    ...REPORTS.map((report) => ({
      path: getReportUrl(report),
      lastModified: report.asOf,
    })),
  ].map(({ path, lastModified }) => ({
    url: pageUrl(path),
    lastModified: lastModified ?? data.generatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const staticPages = [
    {
      url: pageUrl("/"),
      lastModified: data.generatedAt,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: pageUrl("/catalogue"),
      lastModified: data.generatedAt,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: pageUrl("/updates"),
      lastModified: data.generatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: pageUrl("/about"),
      lastModified: data.generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: pageUrl("/accessibility"),
      lastModified: data.generatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: pageUrl("/changelog"),
      lastModified: data.generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: pageUrl("/data-licence"),
      lastModified: data.generatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    },
    {
      url: pageUrl("/venues"),
      lastModified: data.generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: pageUrl("/london-cinemas"),
      lastModified: data.generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ];

  // Only the days still inside the fetch window are listed — the whole set of
  // dated pages, since that is all that exists. A day that ages out drops off
  // here and 404s, which is the honest signal for a page that is genuinely
  // gone. Ranked below the landing page, which is the durable entry point.
  const updateDayPages = groupUpdatesByDay(
    buildUpdates(readDiffBlobs(), data),
  ).map((day) => ({
    url: pageUrl(getUpdateDayPath(day.date)),
    lastModified: day.releases[0].asOf,
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...updateDayPages,
    ...reportPages,
    festivalListPage,
    filmClubListPage,
    cinemaGroupListPage,
    genreListPage,
    ...genrePages,
    formatListPage,
    ...formatPages,
    movieListListPage,
    ...movieListPages,
    collectionListPage,
    ...collectionPages,
    ...moviePages,
    ...venuePages,
    ...boroughPages,
    ...festivalPages,
    ...filmClubPages,
    ...cinemaGroupPages,
  ];
}
