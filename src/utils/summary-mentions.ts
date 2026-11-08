export interface SummaryMention {
  /** The phrase as it was given (not as the text cases it). */
  phrase: string;
  /** The matched text, cased as the summary wrote it. */
  text: string;
  index: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Where the summary names each phrase, first mention only, in the order the
 * text reaches them. One pass with the longest phrases first, so a title that
 * starts another ("Her" in "Her Smell") is only found where it stands alone, and
 * bounded by non-alphanumeric edges so "Her" never matches inside "There".
 * Matching ignores case.
 *
 * Shared by the summary's links and the home page's picks, which have to agree
 * on what the prose names.
 */
export function findSummaryMentions(
  text: string,
  phrases: string[],
): SummaryMention[] {
  const unique = [...new Set(phrases.filter((phrase) => phrase.length > 0))];
  if (unique.length === 0) return [];

  const sorted = unique.sort((a, b) => b.length - a.length);
  const byLower = new Map<string, string>();
  for (const phrase of sorted) {
    const lower = phrase.toLowerCase();
    if (!byLower.has(lower)) byLower.set(lower, phrase);
  }
  const pattern = new RegExp(
    `(?<![A-Za-z0-9])(${sorted.map(escapeRegExp).join("|")})(?![A-Za-z0-9])`,
    "gi",
  );

  const mentions: SummaryMention[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(pattern)) {
    const lower = match[0].toLowerCase();
    const phrase = byLower.get(lower);
    if (!phrase || seen.has(lower)) continue;
    seen.add(lower);
    mentions.push({ phrase, text: match[0], index: match.index ?? 0 });
  }
  return mentions;
}
