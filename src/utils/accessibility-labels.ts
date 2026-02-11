import { AccessibilityFeature } from "@/types";

/**
 * Human-readable labels for accessibility features.
 * Centralizes the mapping to ensure consistency and easy updates.
 */
export const ACCESSIBILITY_LABELS: Record<AccessibilityFeature, string> = {
  [AccessibilityFeature.AudioDescription]: "Audio Description",
  [AccessibilityFeature.BabyFriendly]: "Baby Friendly",
  [AccessibilityFeature.HardOfHearing]: "Hard of Hearing",
  [AccessibilityFeature.Relaxed]: "Relaxed",
  [AccessibilityFeature.Subtitled]: "Subtitles",
};

/**
 * Gets the label for an accessibility feature.
 * Returns the feature key as fallback if not found in the mapping.
 */
export function getAccessibilityLabel(feature: string): string {
  return (
    ACCESSIBILITY_LABELS[feature as AccessibilityFeature] ||
    feature.replace(/([A-Z])/g, " $1").trim()
  );
}
