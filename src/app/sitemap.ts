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
import { ACCESSIBILITY_FEATURES } from "@/data/accessibility-features";
import { getAccessibilityFeatureUrl } from "@/utils/get-accessibility-feature-url";
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

// `lastModified` is only given where a page has a date of its own: the update
// days, their landing page and the reports. Everything else used to carry the
// build's `generatedAt`, which moves on every deploy, several times a day, so
// 2,500 entries claimed to have changed in the last hour, the licence and the
// bot page included. Google stops trusting a sitemap's dates once they are
// routinely wrong, which would discard the true ones too; no date is better.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getStaticData();

  const moviePages = Object.values(data.movies).map((movie: Movie) => ({
    url: pageUrl(getMovieUrl(movie)),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Films that have finished their run keep their pages (`getDepartedData`),
  // so links to them still land, but aren't listed — and are `noindex`: each
  // says little more than that the film has stopped showing, and they were two
  // fifths of the sitemap.

  const venuePages = Object.values(data.venues).map((venue: Venue) => ({
    url: pageUrl(getVenueUrl(venue)),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const venuesByBorough = groupVenuesByBorough(data.venues);

  const boroughPages = LONDON_BOROUGHS.filter((b) =>
    venuesByBorough.has(b.slug),
  ).map((b) => ({
    url: pageUrl(getBoroughUrl(b)),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const festivalListPage = {
    url: pageUrl("/festivals"),
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const festivalPages = FESTIVALS.map((festival) => ({
    url: pageUrl(getFestivalUrl(festival)),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const filmClubListPage = {
    url: pageUrl("/film-clubs"),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  };

  const filmClubPages = FILM_CLUBS.map((club) => ({
    url: pageUrl(getFilmClubUrl(club)),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const cinemaGroupListPage = {
    url: pageUrl("/cinema-groups"),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  };

  const genreListPage = {
    url: pageUrl("/genres"),
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const genrePages = GENRES.map((genre) => ({
    url: pageUrl(getGenreUrl(genre)),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const formatListPage = {
    url: pageUrl("/formats"),
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const formatPages = FORMATS.map((format) => ({
    url: pageUrl(getFormatUrl(format)),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const accessibilityFeaturePages = ACCESSIBILITY_FEATURES.map((feature) => ({
    url: pageUrl(getAccessibilityFeatureUrl(feature.id)),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const movieListListPage = {
    url: pageUrl("/lists"),
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const movieListPages = MOVIE_LISTS.map((list) => ({
    url: pageUrl(getMovieListUrl(list)),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const collectionListPage = {
    url: pageUrl("/collections"),
    changeFrequency: "daily" as const,
    priority: 0.7,
  };

  const collectionPages = Object.values(getCollectionsData()).map(
    (collection) => ({
      url: pageUrl(getCollectionUrl(collection)),
      changeFrequency: "daily" as const,
      priority: 0.6,
    }),
  );

  const venuesByGroup = groupVenuesByGroup(data.venues);

  const cinemaGroupPages = VENUE_GROUPS.filter((group) =>
    venuesByGroup.has(group.slug),
  ).map((group) => ({
    url: pageUrl(getVenueGroupUrl(group)),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // A report is a fixed snapshot: it changes only if it's corrected.
  const reportPages = [
    {
      path: "/reports",
      lastModified: REPORTS.map((r) => r.asOf)
        .sort()
        .at(-1),
    },
    ...REPORTS.map((report) => ({
      path: getReportUrl(report),
      lastModified: report.asOf,
    })),
  ].map(({ path, lastModified }) => ({
    url: pageUrl(path),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

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

  const staticPages = [
    {
      url: pageUrl("/"),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: pageUrl("/catalogue"),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: pageUrl("/updates"),
      lastModified: updateDayPages[0]?.lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: pageUrl("/about"),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: pageUrl("/accessibility"),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: pageUrl("/changelog"),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: pageUrl("/datasets"),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: pageUrl("/data-licence"),
      changeFrequency: "yearly" as const,
      priority: 0.4,
    },
    {
      url: pageUrl("/bot"),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: pageUrl("/datasets/status"),
      changeFrequency: "daily" as const,
      priority: 0.3,
    },
    {
      url: pageUrl("/venues"),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: pageUrl("/london-cinemas"),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: pageUrl("/near-me"),
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
  ];

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
    ...accessibilityFeaturePages,
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
