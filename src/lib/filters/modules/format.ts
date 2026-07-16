import {
  FormatSource,
  FormatPresentation,
  FormatDimension,
  MoviePerformance,
} from "@/types";
import { pruneByPerformances } from "@/utils/prune-movies";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

/**
 * The three format filter IDs. Each filters performances by one field of
 * `performance.format` (source / presentation / dimension).
 */
export type FormatFilterId =
  | FilterId.FormatSource
  | FilterId.FormatPresentation
  | FilterId.FormatDimension;

/** The `performance.format` key a group reads. */
type FormatKey = keyof NonNullable<MoviePerformance["format"]>;

export type FormatOption = { value: string; label: string };

export type FormatGroupConfig = {
  filterId: FormatFilterId;
  key: FormatKey;
  /** Section heading shown in the filter overlay. */
  title: string;
  /** URL query param used when sharing filters. */
  urlParam: string;
  /**
   * The value representing "no special format recorded". A performance with an
   * absent `format.<key>` is treated as this value, so it always matches one
   * option. For source/presentation this is a synthetic value ("digital" /
   * "normal"); for dimension it is the real "2d" value.
   */
  defaultValue: string;
  /** Pills in display order; the default value comes first. */
  options: FormatOption[];
};

/**
 * Config for all three format groups. Shared by the filter modules (below),
 * the filter-config context toggles, the overlay UI, and the filter
 * description, so the option lists and defaults stay in sync.
 *
 * The option lists are the fixed schema enums (like the Accessibility filter),
 * not derived from the data — every pill is always shown, only its count
 * reflects the data.
 */
export const FORMAT_GROUPS: FormatGroupConfig[] = [
  {
    filterId: FilterId.FormatSource,
    key: "source",
    title: "Source Format",
    urlParam: "source",
    defaultValue: "digital",
    options: [
      { value: "digital", label: "Digital" },
      { value: FormatSource.SeventyMm, label: "70mm" },
      { value: FormatSource.ThirtyFiveMm, label: "35mm" },
      { value: FormatSource.SixteenMm, label: "16mm" },
      { value: FormatSource.Vhs, label: "VHS" },
      { value: FormatSource.Laserdisc, label: "LaserDisc" },
      { value: FormatSource.Nitrate, label: "Nitrate" },
    ],
  },
  {
    filterId: FilterId.FormatPresentation,
    key: "presentation",
    title: "Presentation Format",
    urlParam: "presentation",
    defaultValue: "normal",
    options: [
      { value: "normal", label: "Normal" },
      { value: FormatPresentation.Imax, label: "IMAX" },
      { value: FormatPresentation.FourDx, label: "4DX" },
      { value: FormatPresentation.ScreenX, label: "ScreenX" },
      { value: FormatPresentation.DolbyCinema, label: "Dolby Cinema" },
    ],
  },
  {
    filterId: FilterId.FormatDimension,
    key: "dimension",
    title: "Dimension Format",
    urlParam: "dimension",
    defaultValue: FormatDimension.TwoD,
    options: [
      { value: FormatDimension.TwoD, label: "2D" },
      { value: FormatDimension.ThreeD, label: "3D" },
    ],
  },
];

/**
 * Resolves a performance's effective value for a format group. A missing field
 * counts as the group's default value, so every performance maps to exactly one
 * option and is counted/filtered consistently.
 */
export function getEffectiveFormatValue(
  perf: MoviePerformance,
  key: FormatKey,
  defaultValue: string,
): string {
  return perf.format?.[key] ?? defaultValue;
}

/**
 * Builds a performance-level format filter module from a group config.
 * Semantics mirror the other multi-select filters:
 * - `null` = all values selected (no filter applied)
 * - `[]` = none selected (no performances match)
 * - `[...values]` = only performances whose effective value is selected
 */
function createFormatFilter<K extends FormatFilterId>(
  config: FormatGroupConfig & { filterId: K },
): FilterModule<K> {
  const validValues = new Set(config.options.map((o) => o.value));

  return {
    id: config.filterId,

    getDefault: () => null,

    get: (state: FilterState) => state[config.filterId],

    set: (state: FilterState, value: string[] | null): FilterState =>
      ({ ...state, [config.filterId]: value }) as FilterState,

    hasActiveFilter: (state: FilterState): boolean => !!state[config.filterId],

    toUrlParams: (state: FilterState, params: URLSearchParams) => {
      const value = state[config.filterId];
      if (value === null) {
        params.set(config.urlParam, "all");
      } else if (value.length === 0) {
        params.set(config.urlParam, "none");
      } else {
        params.set(config.urlParam, value.join(","));
      }
    },

    fromUrlParams: (params: URLSearchParams) => {
      if (!params.has(config.urlParam)) {
        return undefined;
      }
      const raw = params.get(config.urlParam)!.trim();
      if (raw === "all") return null;
      if (raw === "none") return [];
      return raw
        .split(",")
        .map((v) => v.trim())
        .filter((v) => validValues.has(v));
    },

    apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
      const value = state[config.filterId];

      // null = no filter, include all
      if (!value) {
        return movies;
      }

      // Empty array = none selected, no performances match
      if (value.length === 0) {
        return {};
      }

      const selected = new Set(value);
      return pruneByPerformances(movies, (perf) =>
        selected.has(
          getEffectiveFormatValue(perf, config.key, config.defaultValue),
        ),
      );
    },
  };
}

export const formatSourceFilter = createFormatFilter({
  ...FORMAT_GROUPS[0],
  filterId: FilterId.FormatSource,
});

export const formatPresentationFilter = createFormatFilter({
  ...FORMAT_GROUPS[1],
  filterId: FilterId.FormatPresentation,
});

export const formatDimensionFilter = createFormatFilter({
  ...FORMAT_GROUPS[2],
  filterId: FilterId.FormatDimension,
});
