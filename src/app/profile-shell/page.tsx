import type { Metadata } from "next";
import {
  PROFILE_SHELL_DESCRIPTION,
  PROFILE_SHELL_TITLE,
} from "@/lib/user-profile/page-data";
import { getVenueImagePaths } from "@/utils/get-venue-image";
import { getMovieListProgressItems } from "@/utils/get-movie-list-progress-items";
import ProfileShellContent from "./page-content";

/**
 * Never a page in its own right. The profiles Worker (clusterflick/api-profiles)
 * serves it at `/u/<handle>/` with the profile in a script tag. For a public
 * profile it replaces the title and description, and sets the Open Graph and
 * Twitter tags, `robots` and the canonical link; for a profile not found, it
 * adds `noindex`.
 *
 * No `robots` or canonical here: Next renders the <head> again in the browser
 * from the page's inline RSC payload, where the Worker replaces only the title
 * and description, so a `noindex` here would come back beside the Worker's
 * `index, follow`. So `/profile-shell/` itself is kept from crawlers by
 * robots.txt, and left out of the sitemap.
 */
export const metadata: Metadata = {
  title: PROFILE_SHELL_TITLE,
  description: PROFILE_SHELL_DESCRIPTION,
};

export default function ProfileShellPage() {
  // As /personalise builds them: every venue logo, since which are favourites
  // is known only in the browser, and the film lists' ids for the stats.
  const movieLists = getMovieListProgressItems();
  return (
    <ProfileShellContent
      venueImagePaths={getVenueImagePaths()}
      movieLists={movieLists}
    />
  );
}
