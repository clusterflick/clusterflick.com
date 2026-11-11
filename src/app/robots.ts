import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The template public profiles are served from, at /u/<handle>/, which
      // has no `noindex` of its own (see the page).
      disallow: "/profile-shell/",
    },
    sitemap: "https://clusterflick.com/sitemap.xml",
  };
}
