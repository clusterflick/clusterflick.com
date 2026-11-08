import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { findSummaryMentions } from "@/utils/summary-mentions";

export interface SummaryLinkTarget {
  phrase: string;
  href: string;
}

/**
 * Wraps the first occurrence of each known phrase in `text` with a Link to its
 * canonical page. Which phrases the text names is `findSummaryMentions`'s
 * call (longest first, never inside a word), shared with the home page's picks
 * so the two always agree. Only the provided targets are ever linked — the
 * AI-written prose itself never contains URLs.
 */
export function linkifySummary(
  text: string,
  targets: SummaryLinkTarget[],
): ReactNode[] {
  if (targets.length === 0) return [text];

  const hrefByPhrase = new Map<string, string>();
  for (const target of targets) {
    const lower = target.phrase.toLowerCase();
    if (!hrefByPhrase.has(lower)) hrefByPhrase.set(lower, target.href);
  }
  const mentions = findSummaryMentions(
    text,
    targets.map((target) => target.phrase),
  );

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  mentions.forEach((mention, key) => {
    if (mention.index > lastIndex)
      nodes.push(text.slice(lastIndex, mention.index));
    nodes.push(
      <Link key={key} href={hrefByPhrase.get(mention.phrase.toLowerCase())!}>
        {mention.text}
      </Link>,
    );
    lastIndex = mention.index + mention.text.length;
  });

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>);
}
