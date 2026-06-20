import { Fragment, type ReactNode } from "react";
import Link from "next/link";

export interface SummaryLinkTarget {
  phrase: string;
  href: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps the first occurrence of each known phrase in `text` with a Link to its
 * canonical page. Matching is case-insensitive, longest-phrase-first, bounded by
 * non-alphanumeric edges (so "Her" never matches inside "There"), and each
 * target is linked at most once. Only the provided targets are ever linked — the
 * AI-written prose itself never contains URLs.
 */
export function linkifySummary(
  text: string,
  targets: SummaryLinkTarget[],
): ReactNode[] {
  if (targets.length === 0) return [text];

  const sorted = [...targets].sort((a, b) => b.phrase.length - a.phrase.length);
  const byPhrase = new Map(sorted.map((t) => [t.phrase.toLowerCase(), t.href]));
  const pattern = new RegExp(
    `(?<![A-Za-z0-9])(${sorted.map((t) => escapeRegExp(t.phrase)).join("|")})(?![A-Za-z0-9])`,
    "gi",
  );

  const nodes: ReactNode[] = [];
  const linked = new Set<string>();
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(pattern)) {
    const matchText = match[0];
    const lower = matchText.toLowerCase();
    const href = byPhrase.get(lower);
    if (!href || linked.has(lower)) continue; // only link the first mention

    linked.add(lower);
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    nodes.push(
      <Link key={key++} href={href}>
        {matchText}
      </Link>,
    );
    lastIndex = start + matchText.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>);
}
