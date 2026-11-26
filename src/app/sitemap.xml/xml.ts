import type { SitemapEntry } from "./sections";

// Written by hand rather than by Next's `sitemap.ts` convention, which can't
// produce a sitemap index: its `generateSitemaps` writes the child sitemaps
// and leaves nothing at /sitemap.xml, the address Search Console and
// robots.txt already know. The format is the one that convention wrote.

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastModified(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";

export function buildUrlSet(entries: SitemapEntry[]): string {
  const urls = entries.map(({ url, lastModified, changeFrequency, priority }) =>
    [
      "<url>",
      `<loc>${escapeXml(url)}</loc>`,
      lastModified !== undefined &&
        `<lastmod>${escapeXml(formatLastModified(lastModified))}</lastmod>`,
      changeFrequency && `<changefreq>${changeFrequency}</changefreq>`,
      priority !== undefined && `<priority>${priority}</priority>`,
      "</url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    XML_DECLARATION,
    `<urlset xmlns="${SITEMAP_NAMESPACE}">`,
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

// No <lastmod> on the index: a section has no date of its own, and the
// build's time would claim every section changed on every deploy.
export function buildSitemapIndex(sitemapUrls: string[]): string {
  return [
    XML_DECLARATION,
    `<sitemapindex xmlns="${SITEMAP_NAMESPACE}">`,
    ...sitemapUrls.map(
      (url) => `<sitemap>\n<loc>${escapeXml(url)}</loc>\n</sitemap>`,
    ),
    "</sitemapindex>",
    "",
  ].join("\n");
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
