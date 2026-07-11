import { FormatSource, FormatPresentation, FormatDimension } from "@/types";

/**
 * Human-readable labels for format features.
 * Centralizes the mapping to ensure consistency and easy updates.
 */
type FormatTypes = FormatSource | FormatPresentation | FormatDimension;
export const FORMAT_LABELS: Record<FormatTypes, string> = {
  [FormatSource.Digital]: "Digital",
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
  [FormatDimension.TwoD]: "2D",
  [FormatDimension.ThreeD]: "3D",
};

/**
 * Gets the label for an format feature.
 * Returns the feature key as fallback if not found in the mapping.
 */
export function getFormatLabels(feature: FormatTypes): string {
  return FORMAT_LABELS[feature] || feature.replace(/([A-Z])/g, " $1").trim();
}
