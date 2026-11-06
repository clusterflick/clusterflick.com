import { readFileSync } from "fs";
import { join } from "path";

/**
 * Every source the pipeline reads (ticketing platforms, festivals, councils),
 * by id, to its display name: `dice.fm` → "DICE". Written by
 * `scripts/process-combined-data.js` from clusterflick/scripts' source
 * modules, and read at build time only.
 */
export function getSourceNames(): Record<string, string> {
  const filePath = join(process.cwd(), "public", "data", "sources.json");
  return JSON.parse(readFileSync(filePath, "utf-8"));
}
