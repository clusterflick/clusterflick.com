import type { MoviePerformance, Venue } from "@/types";
import { buildVenueSchema } from "@/utils/build-venue-schema";

export function buildScreeningEventSchema(
  performance: MoviePerformance,
  movie: { title: string; duration?: number },
  movieUrl: string,
  venue?: Venue,
): Record<string, unknown> {
  const offerUrl = performance.bookingUrl || venue?.url;
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
    workFeatured: {
      "@type": "Movie",
      name: movie.title,
      url: movieUrl,
    },
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
