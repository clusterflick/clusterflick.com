import type { Metadata } from "next";
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
  return <PersonalisePageContent />;
}
