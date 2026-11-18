import type {
  MoviePerformance,
  MoviePerformanceFormat,
  Venue,
} from "@clusterflick/catalogue/types";
import { buildVenueSchema } from "@/utils/build-venue-schema";
import { getFormatLabels } from "@/utils/format-labels";
import { getMovieJsonLdId } from "@/utils/build-movie-json-ld";

/**
 * The screening's format as schema.org's `videoFormat` text ("IMAX", "3D",
 * "35mm"). Only the fields the venue set: an absent field is the default
 * (digital, 2D), which says nothing worth marking up, so a screening with
 * no format has no `videoFormat` at all rather than a claimed "Digital".
 */
function getVideoFormat(format?: MoviePerformanceFormat): string[] {
  if (!format) return [];
  return [format.source, format.presentation, format.dimension]
    .filter((value) => value !== undefined)
    .map(getFormatLabels);
}

export function buildScreeningEventSchema(
  performance: MoviePerformance,
  movie: { title: string; duration?: number },
  movieUrl: string,
  venue?: Venue,
): Record<string, unknown> {
  const offerUrl = performance.bookingUrl || venue?.url;
  const videoFormat = getVideoFormat(performance.format);
  return {
    "@context": "https://schema.org",
    "@type": "ScreeningEvent",
    name: movie.title,
    startDate: new Date(performance.time).toISOString(),
    ...(movie.duration && {
      endDate: new Date(performance.time + movie.duration).toISOString(),
    }),
    url: movieUrl,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    // `workPresented` is ScreeningEvent's own property for the film shown.
    // The `@id` ties it to the page's Movie node, so the screenings and the
    // film read as one graph; name and url stay for readers that don't
    // resolve ids.
    workPresented: {
      "@type": "Movie",
      "@id": getMovieJsonLdId(movieUrl),
      name: movie.title,
      url: movieUrl,
    },
    ...(videoFormat.length > 0 && {
      videoFormat: videoFormat.length === 1 ? videoFormat[0] : videoFormat,
    }),
    ...(venue && {
      location: buildVenueSchema(venue),
      organizer: {
        "@type": "Organization",
        name: venue.name,
        url: venue.url,
      },
    }),
    ...(offerUrl && {
      offers: {
        "@type": "Offer",
        url: offerUrl,
        availability: performance.status?.soldOut
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      },
    }),
  };
}
