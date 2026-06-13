/**
 * Expand a truncated URL (e.g. `{3}foo`) back to its full form by replacing the
 * leading `{index}` placeholder with the matching entry from `urlPrefixes`.
 * URLs without a placeholder are returned unchanged.
 */
export function hydrateUrl(
  truncatedUrl: string,
  urlPrefixes: string[],
): string {
  if (!truncatedUrl) return truncatedUrl;
  const match = truncatedUrl.match(/^{(\d+)}/);
  if (!match) return truncatedUrl;
  const index = parseInt(match[1], 10);
  return truncatedUrl.replace(`{${index}}`, urlPrefixes[index]);
}
