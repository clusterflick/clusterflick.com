/**
 * The number of venues the copy claims, rounded down to a step of 50 — see
 * `get-venue-count-floor`, which sets it at build time from the dataset.
 */
const floor = Number(process.env.NEXT_PUBLIC_VENUE_COUNT_FLOOR);

if (!Number.isFinite(floor) || floor <= 0) {
  throw new Error(
    "NEXT_PUBLIC_VENUE_COUNT_FLOOR is not set; it comes from next.config.ts",
  );
}

/** For "over 500 London cinemas". */
export const VENUE_COUNT_FLOOR = floor;

/** For "500+ venues". */
export const VENUE_COUNT = `${floor}+`;
