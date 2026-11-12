import type { Metadata } from "next";
import { getVenueImagePaths } from "@/utils/get-venue-image";
import { getMovieListProgressItems } from "@/utils/get-movie-list-progress-items";
import ProfileSettingsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Your Public Profile",
  description:
    "Choose the address of your public profile, what it shows, and whether anyone can see it.",
  alternates: {
    canonical: "/personalise/profile",
  },
  // An account page, as /personalise is.
  robots: { index: false },
};

export default function ProfileSettingsPage() {
  // As /personalise and the profile page build them, for the preview: every
  // venue logo, and the film lists' ids for the stats.
  return (
    <ProfileSettingsPageContent
      venueImagePaths={getVenueImagePaths()}
      movieLists={getMovieListProgressItems()}
    />
  );
}
