/**
 * The curated movie lists, for scripts/add-movie-list-tmdb-ids.mjs: each
 * list's file, the array it exports and the year tolerance its matching
 * allows. The script can't load the registry (`src/data/movie-lists/index.ts`
 * imports through the `@/` alias, which plain Node doesn't resolve), so they
 * are repeated here, and a unit test holds this table to the registry.
 */
export const LIST_FILES = [
  {
    id: "oscar-best-picture",
    file: "oscar-best-picture.ts",
    exportName: "OSCAR_BEST_PICTURE",
    yearTolerance: 2,
  },
  {
    id: "oscar-best-international-feature",
    file: "oscar-best-international-feature.ts",
    exportName: "OSCAR_BEST_INTERNATIONAL_FEATURE",
    yearTolerance: 2,
  },
  {
    id: "palme-dor-winners",
    file: "palme-dor-winners.ts",
    exportName: "PALME_DOR_WINNERS",
    yearTolerance: 1,
  },
  {
    id: "golden-lion-winners",
    file: "golden-lion-winners.ts",
    exportName: "GOLDEN_LION_WINNERS",
    yearTolerance: 2,
  },
  {
    id: "empire-100-greatest",
    file: "empire-100-greatest.ts",
    exportName: "EMPIRE_100_GREATEST",
    yearTolerance: 1,
  },
  {
    id: "guardian-100-best-21st-century",
    file: "guardian-100-best-21st-century.ts",
    exportName: "GUARDIAN_100_BEST_21ST_CENTURY",
    yearTolerance: 1,
  },
  {
    id: "rt-best-of-all-time",
    file: "rt-best-of-all-time.ts",
    exportName: "RT_BEST_OF_ALL_TIME",
    yearTolerance: 1,
  },
  {
    id: "imdb-top-250",
    file: "imdb-top-250.ts",
    exportName: "IMDB_TOP_250",
    yearTolerance: 1,
  },
  {
    id: "letterboxd-top-500",
    file: "letterboxd-top-500.ts",
    exportName: "LETTERBOXD_TOP_500",
    yearTolerance: 1,
  },
];
