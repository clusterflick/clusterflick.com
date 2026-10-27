import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  DATA_INDEX_URL,
  DATA_LATEST_URL,
  DATA_SCHEMA_URL,
  LICENSED_DATASETS,
} from "@/app/datasets/data";
import { buildLlmsTxt } from "./content";

const SITE = "https://clusterflick.com";
const APP_DIR = path.join(process.cwd(), "src", "app");

const links = [...buildLlmsTxt().matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(
  ([, url]) => url,
);

describe("llms.txt", () => {
  it("names every published dataset", () => {
    const text = buildLlmsTxt();

    expect(links).toContain(DATA_INDEX_URL);
    expect(links).toContain(DATA_LATEST_URL);
    expect(links).toContain(DATA_SCHEMA_URL);
    for (const { pattern, archive } of LICENSED_DATASETS) {
      expect(text).toContain(pattern);
      expect(text).toContain(archive);
    }
  });

  it("links pages at their canonical, trailing-slash address", () => {
    const pages = links.filter(
      (url) => url.startsWith(SITE) && !/\.\w+$/.test(url),
    );

    expect(pages.length).toBeGreaterThan(0);
    expect(pages.filter((url) => !url.endsWith("/"))).toEqual([]);
  });

  it("links only pages the site builds", () => {
    const missing = links
      .filter((url) => url.startsWith(SITE) && url.endsWith("/"))
      .map((url) => new URL(url).pathname)
      .filter(
        (pathname) => !fs.existsSync(path.join(APP_DIR, pathname, "page.tsx")),
      );

    expect(missing).toEqual([]);
  });
});
