import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // The template public profiles are served from, at /u/<handle>/,
        // which has no `noindex` of its own (see the page).
        "/profile-shell/",
        // Any address with a query string. The export is static, so a
        // filtered address serves the same HTML as its bare page, which the
        // sitemap already lists; crawling it costs crawl budget and finds
        // nothing new.
        "/*?",
      ],
    },
    sitemap: "https://clusterflick.com/sitemap.xml",
  };
}
