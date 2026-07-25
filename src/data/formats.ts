/**
 * Canonical registry of screening formats.
 *
 * Each entry maps to one value of a `performance.format` field
 * (`source` / `presentation` / `dimension`) in the combined dataset. Because the
 * format enums are stable, every format gets a permanent landing page at
 * `/formats/<slug>` regardless of whether anything is currently showing — the
 * page renders an empty state when the current data has no matching screenings.
 *
 * The default values are deliberately excluded: they represent "no special
 * format" rather than something worth a landing page. That means Digital
 * (`FormatSourceDefault`) and 2D (`FormatDimensionDefault`) have no page. The
 * presentation group has no default enum value, so all of its members qualify.
 */
import {
  FormatSource,
  FormatPresentation,
  FormatDimension,
  FormatSourceDefault,
  FormatDimensionDefault,
} from "@/types";
import { getFormatLabels } from "@/utils/format-labels";

/** Which `performance.format` field a format value lives on. */
export type FormatKind = "source" | "presentation" | "dimension";

export type FormatValue = FormatSource | FormatPresentation | FormatDimension;

export type FormatSectionDefinition = {
  /** Stable key for React and for the section anchor. */
  id: string;
  /** The kinds gathered under this heading, in display order. */
  kinds: FormatKind[];
  title: string;
  intro: string;
};

/**
 * How the formats index is grouped into sections, in display order.
 *
 * A section can span several kinds, so this is a presentation choice rather
 * than a restatement of `FormatKind`. Dimension rides along with presentation:
 * on its own it is a heading over the single 3D page, and 2D-vs-3D is part of
 * how a film is put on screen rather than a separate idea worth its own block.
 *
 * The source/presentation split is the one visitors get wrong. An IMAX ticket
 * says which auditorium you are sitting in, not what the projector is fed, and
 * these intros exist to head that off before someone opens the IMAX page
 * expecting every screening on it to be an IMAX 70mm print.
 */
export const FORMAT_SECTIONS: FormatSectionDefinition[] = [
  {
    id: "source",
    kinds: ["source"],
    title: "Source",
    intro:
      "What the projector is actually playing. This is where a film's texture comes from, whether that's the grain of a celluloid print or the cleanliness of a digital master.",
  },
  {
    id: "presentation",
    kinds: ["presentation", "dimension"],
    title: "Presentation",
    intro:
      "The auditorium and its equipment: the screen, the projection system, the sound, and whether the film is shown flat or in 3D.",
  },
];

export type FormatDefinition = {
  /** The `performance.format[kind]` value this page represents. */
  id: FormatValue;
  /** The `performance.format` field the value lives on. */
  kind: FormatKind;
  /** Display name, from the shared format labels (e.g. "70mm", "IMAX", "3D"). */
  name: string;
  /** URL slug — the canonical path segment. */
  slug: string;
  /** Alternate slugs that redirect to the canonical page. */
  aliases?: string[];
  /**
   * Other formats worth linking from this one's page, for near-neighbours a
   * visitor might have meant instead (70mm ↔ IMAX 70mm). Cross-links are not
   * inferred, so each side must list the other.
   */
  related?: FormatValue[];
  /** One or two sentences of unique copy for the meta description, hero blurb,
   *  and JSON-LD description. Kept human-written to avoid thin/duplicate content. */
  seoDescription: string;
};

type FormatSeed = Omit<FormatDefinition, "name"> & { name?: string };

/** Build a definition, defaulting `name` and `slug` from the shared labels/id. */
function defineFormat(seed: FormatSeed): FormatDefinition {
  return { ...seed, name: seed.name ?? getFormatLabels(seed.id) };
}

const SOURCE_FORMATS: FormatSeed[] = [
  {
    id: FormatSource.SeventyMm,
    kind: "source",
    slug: "70mm",
    related: [FormatSource.ImaxSeventyMm],
    seoDescription:
      "Large-format 70mm prints deliver exceptional depth, clarity and scale on the big screen. Find 70mm screenings across London's cinemas, from restored classics to blockbuster revivals.",
  },
  {
    id: FormatSource.ImaxSeventyMm,
    kind: "source",
    slug: "imax-70mm",
    aliases: ["imax70mm", "15-70"],
    related: [FormatSource.SeventyMm, FormatPresentation.Imax],
    seoDescription:
      "The largest film format in commercial exhibition: 15-perforation 70mm running horizontally through the projector, for roughly ten times the negative area of a standard 35mm frame.",
  },
  {
    id: FormatSource.ThirtyFiveMm,
    kind: "source",
    slug: "35mm",
    seoDescription:
      "Celluloid the way it was meant to be seen, grain and all. Discover 35mm film screenings at repertory and independent cinemas across London.",
  },
  {
    id: FormatSource.SixteenMm,
    kind: "source",
    slug: "16mm",
    seoDescription:
      "Rare archival prints, avant-garde work and rediscovered gems shown on 16mm. Find 16mm screenings at cinemas and film clubs across London.",
  },
  {
    id: FormatSource.Vhs,
    kind: "source",
    slug: "vhs",
    seoDescription:
      "Lo-fi nostalgia and cult oddities screened straight from tape. Discover VHS screenings at cinemas and clubs across London.",
  },
  {
    id: FormatSource.Laserdisc,
    kind: "source",
    slug: "laserdisc",
    aliases: ["laser-disc"],
    seoDescription:
      "A format for collectors and cinephiles, offering a distinctive analogue-era presentation. Find LaserDisc screenings at specialist cinemas and clubs across London.",
  },
  {
    id: FormatSource.Nitrate,
    kind: "source",
    slug: "nitrate",
    seoDescription:
      "The luminous, flammable film stock of early cinema, shown on specially equipped projectors. Find rare nitrate screenings across London.",
  },
];

const PRESENTATION_FORMATS: FormatSeed[] = [
  {
    id: FormatPresentation.Imax,
    kind: "presentation",
    slug: "imax",
    related: [FormatSource.ImaxSeventyMm],
    seoDescription:
      "The largest screens and highest resolution for maximum immersion. Find IMAX screenings across London's cinemas.",
  },
  {
    id: FormatPresentation.FourDx,
    kind: "presentation",
    slug: "4dx",
    seoDescription:
      "Motion seats, wind, water and scent bring the action off the screen and into the auditorium. Discover 4DX screenings at cinemas across London.",
  },
  {
    id: FormatPresentation.ScreenX,
    kind: "presentation",
    slug: "screenx",
    aliases: ["screen-x"],
    seoDescription:
      "Panoramic 270-degree projection that wraps the film around three walls of the auditorium. Find ScreenX screenings across London's cinemas.",
  },
  {
    id: FormatPresentation.DolbyCinema,
    kind: "presentation",
    slug: "dolby-cinema",
    aliases: ["dolby"],
    seoDescription:
      "Dolby Vision imaging and Dolby Atmos sound for reference-grade picture and audio. Find Dolby Cinema screenings across London.",
  },
];

const DIMENSION_FORMATS: FormatSeed[] = [
  {
    id: FormatDimension.ThreeD,
    kind: "dimension",
    slug: "3d",
    seoDescription:
      "Films presented in stereoscopic 3D for added depth and spectacle. Find 3D screenings across London's cinemas.",
  },
];

export const FORMATS: FormatDefinition[] = [
  ...SOURCE_FORMATS,
  ...PRESENTATION_FORMATS,
  ...DIMENSION_FORMATS,
].map(defineFormat);

// The default values represent "no special format" and must never gain a page.
const EXCLUDED_DEFAULTS: FormatValue[] = [
  FormatSourceDefault,
  FormatDimensionDefault,
];
if (FORMATS.some((f) => EXCLUDED_DEFAULTS.includes(f.id))) {
  throw new Error("A default format value must not have a landing page.");
}

/** The formats listed in `related`, in canonical `FORMATS` order. */
export function getRelatedFormats(
  format: FormatDefinition,
): FormatDefinition[] {
  if (!format.related?.length) return [];
  const related = new Set(format.related);
  return FORMATS.filter((f) => related.has(f.id));
}

// A `related` entry that doesn't resolve would silently drop a cross-link, so
// fail the build instead.
for (const format of FORMATS) {
  const resolved = getRelatedFormats(format).length;
  if (resolved !== (format.related?.length ?? 0)) {
    throw new Error(`Format "${format.slug}" lists an unknown related format.`);
  }
}

// Every kind must land in exactly one section, otherwise a new format could be
// dropped from the index (no section claims it) or listed twice.
for (const format of FORMATS) {
  const claiming = FORMAT_SECTIONS.filter((s) => s.kinds.includes(format.kind));
  if (claiming.length !== 1) {
    throw new Error(
      `Format kind "${format.kind}" is claimed by ${claiming.length} sections; expected exactly 1.`,
    );
  }
}

/**
 * Resolve a URL slug to a format, following aliases. Returns the format and
 * whether the slug was an alias (so the page can emit a canonical redirect).
 */
export function resolveFormat(
  slug: string,
): { format: FormatDefinition; isAlias: boolean } | null {
  const direct = FORMATS.find((f) => f.slug === slug);
  if (direct) return { format: direct, isAlias: false };

  const byAlias = FORMATS.find((f) => f.aliases?.includes(slug));
  if (byAlias) return { format: byAlias, isAlias: true };

  return null;
}
