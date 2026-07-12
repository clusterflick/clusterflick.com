import {
  FormatSource,
  FormatPresentation,
  FormatDimension,
  FormatSourceDefault,
  FormatDimensionDefault,
} from "@/types";

/**
 * Human-readable labels for format features.
 * Centralizes the mapping to ensure consistency and easy updates.
 */
type FormatTypes = FormatSource | FormatPresentation | FormatDimension;
export const FORMAT_LABELS: Record<FormatTypes, string> = {
  [FormatSourceDefault]: "Digital",
  [FormatSource.SeventyMm]: "70mm",
  [FormatSource.ThirtyFiveMm]: "35mm",
  [FormatSource.SixteenMm]: "16mm",
  [FormatSource.Vhs]: "VHS",
  [FormatSource.Laserdisc]: "Laser Disc",
  [FormatSource.Nitrate]: "Nitrate",
  [FormatPresentation.Imax]: "IMAX",
  [FormatPresentation.FourDx]: "4DX",
  [FormatPresentation.ScreenX]: "Screen X",
  [FormatPresentation.DolbyCinema]: "Dolby Cinema",
  [FormatDimensionDefault]: "2D",
  [FormatDimension.ThreeD]: "3D",
};

/**
 * Gets the label for an format feature.
 * Returns the feature key as fallback if not found in the mapping.
 */
export function getFormatLabels(feature: FormatTypes): string {
  return FORMAT_LABELS[feature] || feature.replace(/([A-Z])/g, " $1").trim();
}

/**
 * Collection name for a format landing page, e.g. "70mm Films".
 */
export function getFormatCollectionName(feature: FormatTypes): string {
  return `${getFormatLabels(feature)} Films`;
}

/**
 * Page title / films-section heading for a format landing page,
 * e.g. "70mm Films Showing in London".
 */
export function getFormatPageTitle(feature: FormatTypes): string {
  return `${getFormatLabels(feature)} Films Showing in London`;
}

/**
 * Cinemas-section heading for a format landing page,
 * e.g. "Cinemas showing 70mm films".
 */
export function getFormatCinemasTitle(feature: FormatTypes): string {
  return `Cinemas showing ${getFormatLabels(feature)} films`;
}
