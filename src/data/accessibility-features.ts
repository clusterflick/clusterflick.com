/**
 * Canonical registry of accessibility features.
 *
 * Each entry maps to one flag of `performance.accessibility` in the combined
 * dataset. The flags are a fixed set, so every feature gets a permanent landing
 * page at `/accessibility/<slug>` regardless of whether anything is currently
 * showing — the page renders an empty state when nothing matches, as the
 * format pages do.
 *
 * The descriptions are shared by `/accessibility`, where each feature has a
 * section (and an FAQ answer), and by the feature's own page.
 */
import { AccessibilityFeature } from "@/types";

export type AccessibilityFeatureDefinition = {
  id: AccessibilityFeature;
  /** URL segment under `/accessibility/`. */
  slug: string;
  /**
   * What the screenings are called, as a heading: "Audio Described
   * Screenings". The page's `<title>` adds "in London".
   */
  title: string;
  shortDescription: string;
  description: string;
  /** Meta description for the feature's page. */
  seoDescription: string;
  /**
   * Features a visitor on this page may well have wanted instead, linked from
   * its hero. Kept symmetric.
   */
  related?: AccessibilityFeature[];
};

export const ACCESSIBILITY_FEATURES: AccessibilityFeatureDefinition[] = [
  {
    id: AccessibilityFeature.AudioDescription,
    slug: "audio-description",
    title: "Audio Described Screenings",
    shortDescription: "For blind or visually impaired viewers",
    description:
      "Screenings with a supplementary audio track that describes visual elements — actions, expressions, and scene changes — for blind or visually impaired viewers.",
    seoDescription:
      "Audio described film screenings in London, for blind and visually impaired viewers — every film and cinema with an audio description track, updated daily.",
  },
  {
    id: AccessibilityFeature.BabyFriendly,
    slug: "baby-friendly",
    title: "Baby Friendly Screenings",
    shortDescription: "For parents and carers with young children",
    description:
      "Screenings designed to welcome parents or carers with babies and young children. Typically includes lower volume, lights slightly raised, and pram parking. Also covers kids club and family programming.",
    seoDescription:
      "Parent and baby film screenings in London, plus kids clubs and family showings — every baby friendly screening and the cinemas running them, updated daily.",
  },
  {
    id: AccessibilityFeature.DogFriendly,
    slug: "dog-friendly",
    title: "Dog Friendly Screenings",
    shortDescription: "Bring your dog along",
    description:
      "Screenings where you are welcome to bring your dog. You don't need one to go — everyone is welcome — and some venues lower the sound for the dogs' sake. Worth knowing, too, if you'd rather avoid dogs.",
    seoDescription:
      "Dog friendly cinema in London — the screenings you can bring your dog to, and the cinemas that run them, updated daily.",
  },
  {
    id: AccessibilityFeature.HardOfHearing,
    slug: "hard-of-hearing",
    title: "Hard of Hearing Screenings",
    shortDescription: "For deaf or hard-of-hearing viewers",
    description:
      "Screenings with captions or other support for deaf or hard-of-hearing viewers. This covers open captions, closed captions, SDH (Subtitles for the Deaf and Hard of Hearing), and BSL (British Sign Language) interpreted screenings.",
    seoDescription:
      "Captioned, SDH and BSL interpreted film screenings in London for deaf and hard-of-hearing viewers — every film and cinema, updated daily.",
    related: [AccessibilityFeature.Subtitled],
  },
  {
    id: AccessibilityFeature.Relaxed,
    slug: "relaxed",
    title: "Relaxed Screenings",
    shortDescription: "For neurodiverse audiences",
    description:
      "Screenings with adjustments for neurodiverse audiences, including autistic viewers and people with learning disabilities or sensory sensitivities. Features lower sound, slightly raised lights, no trailers, and a calm, tolerant atmosphere.",
    seoDescription:
      "Relaxed and autism friendly film screenings in London, with lower sound and raised lights — every film and cinema, updated daily.",
  },
  {
    // A bucket: venues label subtitles for hard-of-hearing viewers and
    // subtitles translating a film the same way, and often don't say which.
    // A screening is only filed under Hard of Hearing when the venue makes the
    // hearing support clear, so this one holds both.
    id: AccessibilityFeature.Subtitled,
    slug: "subtitled",
    title: "Subtitled Screenings",
    shortDescription: "For following the dialogue on screen",
    description:
      "Screenings shown with subtitles. Venues use the label for two different needs and often don't say which: subtitles to help viewers who can't hear well follow the dialogue, and subtitles translating a film's language. If you need one in particular, check the venue's listing before booking.",
    seoDescription:
      "Subtitled film screenings in London — for following the dialogue if you can't hear well, or for films in another language. Every film and cinema, updated daily.",
    related: [AccessibilityFeature.HardOfHearing],
  },
];

const BY_ID = new Map(ACCESSIBILITY_FEATURES.map((f) => [f.id, f]));
const BY_SLUG = new Map(ACCESSIBILITY_FEATURES.map((f) => [f.slug, f]));

export function getAccessibilityFeature(
  id: AccessibilityFeature,
): AccessibilityFeatureDefinition {
  const feature = BY_ID.get(id);
  if (!feature) {
    throw new Error(`Accessibility feature ${id} is missing from the registry`);
  }
  return feature;
}

export function resolveAccessibilityFeature(
  slug: string,
): AccessibilityFeatureDefinition | undefined {
  return BY_SLUG.get(slug);
}

export function getRelatedAccessibilityFeatures(
  feature: AccessibilityFeatureDefinition,
): AccessibilityFeatureDefinition[] {
  return (feature.related ?? []).map(getAccessibilityFeature);
}
