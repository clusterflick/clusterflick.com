import type { Venue } from "@/types";

export function buildVenueSchema(
  venue: Venue,
  options?: { url?: string; image?: string },
): Record<string, unknown> {
  return {
    "@type": "MovieTheater",
    name: venue.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address.replace(/, UK$/, ""),
      addressLocality: "London",
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: venue.geo.lat,
      longitude: venue.geo.lon,
    },
    ...(options?.url && { url: options.url }),
    ...(options?.image && { image: options.image }),
  };
}
