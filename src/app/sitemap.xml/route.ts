import { SITEMAP_SECTION_IDS, getSitemapSectionUrl } from "./sections";
import { buildSitemapIndex, xmlResponse } from "./xml";

export const dynamic = "force-static";

/**
 * The sitemap index: one sitemap per section (see `SITEMAP_SECTION_IDS`), at
 * the address the single sitemap had, so robots.txt and the sitemap already
 * submitted to Search Console keep working.
 */
export function GET() {
  return xmlResponse(
    buildSitemapIndex(SITEMAP_SECTION_IDS.map(getSitemapSectionUrl)),
  );
}
