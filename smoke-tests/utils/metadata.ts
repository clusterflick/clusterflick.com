import { Page, expect } from "@playwright/test";

export interface PageMetadata {
  title: string;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

export async function getMetadata(page: Page): Promise<PageMetadata> {
  return page.evaluate(() => ({
    title: document.title,
    description:
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") ?? null,
    canonical:
      document.querySelector('link[rel="canonical"]')?.getAttribute("href") ??
      null,
    robots:
      document.querySelector('meta[name="robots"]')?.getAttribute("content") ??
      null,
    ogTitle:
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content") ?? null,
    ogDescription:
      document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content") ?? null,
    ogImage:
      document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content") ?? null,
  }));
}

// `document.title` is not the raw text of the <title> element: the getter strips
// leading/trailing whitespace and collapses internal runs of it to a single
// space. Expected titles here are scraped from the DOM with `textContent`,
// which does neither — so a film whose title carries a double space ("…presents
// 8  Astonishing Animated Shorts…") failed a raw substring check on whitespace
// alone. Playwright's own `toContainText` normalises for the same reason.
function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

// `trailingSlash: true` (next.config.ts) makes the live URL end in "/", but
// `alternates.canonical` values across src/app/**/page.tsx are written without
// one — comparing raw strings would fail on that alone, not on a real bug.
function stripTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Asserts the metadata every indexable page must carry: a title that follows
 * the "%s | Clusterflick" template, a description short enough to survive as
 * a search snippet, and a canonical link pointing at the expected path.
 */
export async function expectIndexableMetadata(
  page: Page,
  {
    titleContains,
    canonicalPath,
  }: { titleContains: string; canonicalPath: string },
): Promise<PageMetadata> {
  const metadata = await getMetadata(page);

  expect(normalizeWhitespace(metadata.title)).toContain(
    normalizeWhitespace(titleContains),
  );
  expect(metadata.title).toContain("Clusterflick");

  expect(metadata.description).toBeTruthy();
  expect(metadata.description!.length).toBeGreaterThan(15);
  expect(metadata.description!.length).toBeLessThan(500);

  expect(metadata.canonical).toBeTruthy();
  expect(stripTrailingSlash(new URL(metadata.canonical!).pathname)).toBe(
    stripTrailingSlash(canonicalPath),
  );

  expect(metadata.robots ?? "").not.toContain("noindex");

  expect(metadata.ogTitle).toBeTruthy();
  expect(metadata.ogDescription).toBeTruthy();
  if (metadata.ogImage) {
    expect(metadata.ogImage).toMatch(/^https?:\/\//);
  }

  return metadata;
}
