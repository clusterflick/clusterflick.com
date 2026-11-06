import fs from "node:fs";
import path from "node:path";
import getMetaDataFilename from "./get-meta-data-filename";

/** Venue claims are rounded down to this step: 511 venues reads "500+". */
const STEP = 50;

/**
 * How many venues the copy can claim ("500+ venues"), worked out from the
 * processed data so it can't drift from the dataset the way a hand-written
 * "450+" did. Read at config time, beside the meta filename, and handed to
 * every page as `NEXT_PUBLIC_VENUE_COUNT_FLOOR`.
 *
 * Rounded down so the claim is never more than the data supports, and to a
 * step so it doesn't change with every venue that joins or leaves.
 */
function getVenueCountFloor(): number {
  const filename = getMetaDataFilename();
  if (!filename) {
    throw new Error(
      "No data.meta.*.json found in public/data — run `npm run process-combined-data` first",
    );
  }
  const meta = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "data", filename),
      "utf-8",
    ),
  );
  const count = Object.keys(meta.venues ?? {}).length;
  if (count < STEP) {
    throw new Error(
      `Only ${count} venues in ${filename}; refusing to claim 0+`,
    );
  }
  return Math.floor(count / STEP) * STEP;
}

export default getVenueCountFloor;
