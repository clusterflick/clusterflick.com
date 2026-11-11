import type { NextConfig } from "next";
import getMetaDataFilename from "./src/utils/get-meta-data-filename";
import getVenueCountFloor from "./src/utils/get-venue-count-floor";

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: "export",
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for static export
  },
  env: {
    NEXT_PUBLIC_DATA_FILENAME: getMetaDataFilename(),
    NEXT_PUBLIC_VENUE_COUNT_FLOOR: String(getVenueCountFloor()),
  },
  // In production two Workers sit in front of the static site: the TMDB
  // search (clusterflick/api-tmdb-search) and public profiles
  // (clusterflick/api-profiles). `next dev` sends their paths to each one's
  // `wrangler dev` instead; a static export can't have rewrites.
  ...(process.env.NODE_ENV === "development" && {
    rewrites: async () => [
      {
        source: "/api/tmdb/:path*",
        destination: "http://localhost:8787/api/tmdb/:path*",
      },
      { source: "/u", destination: "http://localhost:8788/u" },
      { source: "/u/:path*", destination: "http://localhost:8788/u/:path*" },
    ],
  }),
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
};

export default nextConfig;
