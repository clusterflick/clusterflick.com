import type { NextConfig } from "next";
import getMetaDataFilename from "./src/utils/get-meta-data-filename";

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: "export",
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for static export
  },
  env: {
    NEXT_PUBLIC_DATA_FILENAME: getMetaDataFilename(),
  },
  // In production the TMDB search Worker (clusterflick/api-tmdb-search) sits
  // on this path in front of the static site. `next dev` sends it to the
  // Worker's `wrangler dev` instead; a static export can't have rewrites.
  ...(process.env.NODE_ENV === "development" && {
    rewrites: async () => [
      {
        source: "/api/tmdb/:path*",
        destination: "http://localhost:8787/api/tmdb/:path*",
      },
    ],
  }),
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
};

export default nextConfig;
