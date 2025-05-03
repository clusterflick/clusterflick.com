import type { NextConfig } from "next";
import getDataFilename from "@/utils/get-data-filename";

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: "export",
  reactStrictMode: true,
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
  env: {
    NEXT_PUBLIC_DATA_FILENAME: getDataFilename().join(","),
  },
};

export default nextConfig;
