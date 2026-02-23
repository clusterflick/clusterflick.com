import type { MoviePerformance, Venue } from "@/types";
import { buildVenueSchema } from "@/utils/build-venue-schema";

export function buildScreeningEventSchema(
  performance: MoviePerformance,
  movie: { title: string; duration?: number },
  movieUrl: string,
  venue?: Venue,
): Record<string, unknown> {
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
      offers: {
        "@type": "Offer",
        url: venue.url,
        availability: performance.status?.soldOut
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      },
    }),
  };
}
