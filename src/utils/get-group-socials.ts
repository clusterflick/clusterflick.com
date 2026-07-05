import type { VenueAttributes } from "./get-venue-attributes";
import type { SocialHandles } from "./build-social-links";

type Platform = "letterboxd" | "twitter" | "instagram";
const PLATFORMS: Platform[] = ["letterboxd", "twitter", "instagram"];

/**
 * Infer a cinema group's shared corporate social accounts from its venues.
 *
 * For each platform, the single most-common handle is treated as the group
 * account only if it's shared by a strict majority of the group's venues
 * (> 50%) and by at least two of them. Chains that give each venue its own
 * account (e.g. Picturehouse / Curzon on Instagram) therefore return null for
 * that platform, rather than promoting one venue's personal account.
 *
 * @param venueSocials one entry per group venue (null when a venue has none)
 * @param totalVenues  the group's full venue count (the majority denominator)
 */
export function getGroupCorporateSocials(
  venueSocials: Array<VenueAttributes["socials"]>,
  totalVenues: number,
): SocialHandles {
  const result: NonNullable<SocialHandles> = {
    letterboxd: null,
    twitter: null,
    instagram: null,
  };

  for (const platform of PLATFORMS) {
    const counts = new Map<string, number>();
    for (const socials of venueSocials) {
      const handle = socials?.[platform];
      if (handle) counts.set(handle, (counts.get(handle) || 0) + 1);
    }

    let bestHandle: string | null = null;
    let bestCount = 0;
    for (const [handle, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        bestHandle = handle;
      }
    }

    if (bestHandle && bestCount >= 2 && bestCount / totalVenues > 0.5) {
      result[platform] = bestHandle;
    }
  }

  return result;
}
