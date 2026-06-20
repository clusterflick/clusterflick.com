import { readFileSync } from "fs";
import { join } from "path";

/** A known entity mentioned in the summary, keyed by the exact phrase used. */
export interface EditorialSummaryLink {
  phrase: string;
  movieId?: string;
  venueId?: string;
}

export interface EditorialSummary {
  generatedAt: string;
  /** "ai" when written by Gemini, "template" for the deterministic fallback. */
  source: "ai" | "template";
  text: string;
  /** Linkable entities the summary may mention (films, venues). */
  links?: EditorialSummaryLink[];
}

/**
 * Reads the build-time editorial summary written by `scripts/generate-summary.mjs`.
 * It's a build-only artifact (read here, baked into the static HTML, never
 * fetched by the client) so it lives at the repo root rather than in public/.
 * Returns null when the file is absent (e.g. local dev that hasn't run the
 * script) so the home page can simply omit the section.
 */
export function getEditorialSummary(): EditorialSummary | null {
  try {
    const summaryPath = join(process.cwd(), "editorial-summary.json");
    const content = readFileSync(summaryPath, "utf-8");
    const summary = JSON.parse(content) as EditorialSummary;
    if (!summary.text) return null;
    return summary;
  } catch {
    return null;
  }
}
