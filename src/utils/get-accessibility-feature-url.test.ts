import { describe, it, expect } from "vitest";
import { AccessibilityFeature } from "@/types";
import {
  ACCESSIBILITY_FEATURES,
  getRelatedAccessibilityFeatures,
  resolveAccessibilityFeature,
} from "@/data/accessibility-features";
import {
  getAccessibilityFeatureUrl,
  getAccessibilityFilterUrl,
} from "./get-accessibility-feature-url";

describe("accessibility feature pages", () => {
  it("gives every feature exactly one page", () => {
    expect(ACCESSIBILITY_FEATURES.map((f) => f.id).sort()).toEqual(
      Object.values(AccessibilityFeature).sort(),
    );
    const slugs = ACCESSIBILITY_FEATURES.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves each page's slug back to its feature", () => {
    for (const feature of Object.values(AccessibilityFeature)) {
      const slug = getAccessibilityFeatureUrl(feature).replace(
        "/accessibility/",
        "",
      );
      expect(resolveAccessibilityFeature(slug)?.id).toBe(feature);
    }
  });

  it("links related features both ways", () => {
    for (const feature of ACCESSIBILITY_FEATURES) {
      for (const related of getRelatedAccessibilityFeatures(feature)) {
        expect(related.related).toContain(feature.id);
      }
    }
  });

  it("opens the catalogue past the default week and categories", () => {
    expect(getAccessibilityFilterUrl(AccessibilityFeature.Relaxed)).toBe(
      "/catalogue?base=all&accessibility=relaxed",
    );
  });
});
