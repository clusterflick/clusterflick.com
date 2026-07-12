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
    seoDescription:
      "Large-format 70mm prints deliver exceptional depth, clarity and scale on the big screen. Find 70mm screenings across London's cinemas, from restored classics to blockbuster revivals.",
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
