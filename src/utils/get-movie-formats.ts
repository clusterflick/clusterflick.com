import type { MoviePerformance } from "@/types";
import {
  FORMATS,
  type FormatDefinition,
  type FormatKind,
} from "@/data/formats";

// Lookup a format definition by "<kind>:<value>". Default format values
// (Digital / 2D) and the synthetic "normal" presentation aren't in FORMATS, so
// they never resolve — only non-default formats get a tag.
const FORMAT_BY_KEY = new Map(FORMATS.map((f) => [`${f.kind}:${f.id}`, f]));

const FORMAT_KINDS: FormatKind[] = ["source", "presentation", "dimension"];

/**
 * The distinct non-default formats a film screens in, across its upcoming
 * performances. Returned in canonical `FORMATS` order (sources, then
 * presentations, then dimensions) so tags render consistently.
 *
 * `nowTs` should be the data's generated-at timestamp so results match what the
 * corresponding format pages list.
 */
export function getMovieFormats(
  performances: MoviePerformance[],
  nowTs: number,
): FormatDefinition[] {
  const found = new Set<FormatDefinition>();

  for (const perf of performances) {
    if (perf.time < nowTs || !perf.format) continue;
    for (const kind of FORMAT_KINDS) {
      const value = perf.format[kind];
      if (!value) continue;
      const def = FORMAT_BY_KEY.get(`${kind}:${value}`);
      if (def) found.add(def);
    }
  }

  return FORMATS.filter((f) => found.has(f));
}
