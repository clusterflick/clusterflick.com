import {
  SITEMAP_SECTION_IDS,
  type SitemapSectionId,
  getSitemapSections,
} from "@/app/sitemap.xml/sections";
import { buildUrlSet, xmlResponse } from "@/app/sitemap.xml/xml";

export const dynamic = "force-static";
export const dynamicParams = false;

// The param is the whole file name, so the export writes
// /sitemaps/<section>.xml rather than a directory.
export function generateStaticParams() {
  return SITEMAP_SECTION_IDS.map((id) => ({ file: `${id}.xml` }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const id = file.replace(/\.xml$/, "") as SitemapSectionId;
  if (!SITEMAP_SECTION_IDS.includes(id)) {
    throw new Error(`No sitemap section for ${file}`);
  }
  const sections = await getSitemapSections();
  return xmlResponse(buildUrlSet(sections[id]));
}
