import { readFileSync } from "fs";
import { join } from "path";
import {
  summariseReleases,
  type DatasetKey,
  type ReleaseLogRow,
  type ReleaseStatus,
} from "@/utils/release-status";

interface PublishedRelease {
  repository: string;
  tag: string;
  publishedAt: string;
}

let status: ReleaseStatus | null = null;

/**
 * The release history behind /datasets/status/, from the log
 * scripts/fetch-release-log.js downloads, plus the releases the site was just
 * built from (index.json's), which the log can be a step behind.
 *
 * A missing log fails the build. Unlike a venue calendar, there's no empty
 * state that would be honest here: a status page with no history reads as a
 * project that has never released anything.
 */
export function getReleaseStatus(): ReleaseStatus {
  if (status) return status;

  const logPath = join(process.cwd(), "release-log", "release-log.json");
  let rows: ReleaseLogRow[];
  try {
    rows = JSON.parse(readFileSync(logPath, "utf-8"));
  } catch (error) {
    throw new Error(
      `Could not read ${logPath} - run \`npm run fetch-release-log\` first (${(error as Error).message})`,
    );
  }

  const indexPath = join(process.cwd(), "public", "datasets", "index.json");
  let releases: Partial<Record<DatasetKey, PublishedRelease | null>> = {};
  try {
    releases = JSON.parse(readFileSync(indexPath, "utf-8")).releases ?? {};
  } catch {
    // No published data in this checkout; the log alone still tells the story
  }
  const current = Object.fromEntries(
    Object.entries(releases).map(([dataset, release]) => [
      dataset,
      release ? { dataset: dataset as DatasetKey, ...release } : null,
    ]),
  );

  status = summariseReleases(rows, current, new Date());
  return status;
}
