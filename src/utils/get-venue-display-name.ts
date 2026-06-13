/**
 * Words removed wherever they occur within a venue's name for the given group
 * (matched whole-word, case-insensitive). Use for chains whose name sits in the
 * middle or at the end of venue names rather than only at the front, e.g.
 * "Clapham Picturehouse" or "West Norwood Library & Picturehouse".
 */
const GROUP_WORDS_TO_STRIP: Record<string, string[]> = {
  Picturehouse: ["Picturehouse"],
};

/**
 * Prefixes stripped only from the start of the name, in addition to the group
 * label itself. Use for venues that repeat a brand word ("Firmdale") or a
 * generic descriptor ("The Cinema") at the front.
 */
const EXTRA_GROUP_PREFIXES: Record<string, string[]> = {
  "Firmdale Hotels": ["Firmdale"],
  "Olympic Studios": ["The Cinema"],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Collapse whitespace and trim dangling joining words/punctuation. */
function tidy(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:&|and|\+|-|–|,)\s+/i, "")
    .replace(/\s+(?:&|and|\+|-|–|,)$/i, "")
    .trim();
}

/**
 * Build the display name for a venue shown under its group heading. Removes the
 * redundant group name — as a prefix, or anywhere for configured groups — plus
 * any configured extra prefixes, then capitalises only the first letter so
 * names left lowercase after stripping (e.g. "at Selfridges" → "At Selfridges")
 * read correctly. Falls back to the full name when stripping leaves nothing.
 */
export function getVenueDisplayName(name: string, groupLabel: string): string {
  let result = name;

  // Remove the group's name wherever it appears (e.g. "Clapham Picturehouse").
  for (const word of GROUP_WORDS_TO_STRIP[groupLabel] ?? []) {
    result = result.replace(
      new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi"),
      " ",
    );
  }

  // Strip a redundant prefix: the group label or any configured extra.
  for (const prefix of [
    groupLabel,
    ...(EXTRA_GROUP_PREFIXES[groupLabel] ?? []),
  ]) {
    const pattern = new RegExp(`^${escapeRegExp(prefix)}\\s+`, "i");
    if (pattern.test(result)) {
      result = result.replace(pattern, "");
      break;
    }
  }

  result = tidy(result);
  if (!result) return name;

  return result.charAt(0).toUpperCase() + result.slice(1);
}
