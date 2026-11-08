import type { AccessibilityFeature } from "@/types";
import { getAccessibilityFeature } from "@/data/accessibility-features";

/** Canonical path for an accessibility feature's landing page. */
export function getAccessibilityFeatureUrl(
  feature: AccessibilityFeature,
): string {
  return `/accessibility/${getAccessibilityFeature(feature).slug}`;
}

/**
 * The catalogue filtered to this feature's screenings. `base=all` clears the
 * default week and categories, so it shows every screening the feature's page
 * counts rather than the next seven days of films.
 */
export function getAccessibilityFilterUrl(
  feature: AccessibilityFeature,
): string {
  return `/catalogue?${getAccessibilityFilterParams(feature)}`;
}

/** Query string (no leading `?`) filtering to this feature's screenings. */
export function getAccessibilityFilterParams(
  feature: AccessibilityFeature,
): string {
  return `base=all&accessibility=${feature}`;
}
