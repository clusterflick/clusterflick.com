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
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
};

export default nextConfig;
