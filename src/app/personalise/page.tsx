import type { Metadata } from "next";
import { getVenueImagePaths } from "@/utils/get-venue-image";
import PersonalisePageContent from "./page-content";

export const metadata: Metadata = {
  title: "Personalise",
  description:
    "Keep a watchlist of films you want to catch at London cinemas, and a record of the ones you've seen.",
  alternates: {
    canonical: "/personalise",
  },
  // An account page: everything useful on it depends on who's signed in.
  robots: { index: false },
};

export default function PersonalisePage() {
  // Which venues are favourites is only known in the browser, so every logo's
  // path ships: a few KB, on a page nobody reaches by accident.
  return <PersonalisePageContent venueImagePaths={getVenueImagePaths()} />;
}
