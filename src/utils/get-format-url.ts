import type { FormatDefinition } from "@/data/formats";

/** Canonical path for a format landing page. */
export function getFormatUrl(format: Pick<FormatDefinition, "slug">): string {
  return `/formats/${format.slug}`;
}
