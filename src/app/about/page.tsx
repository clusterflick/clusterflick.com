import type { Metadata } from "next";
import AboutContent from "./content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `About Clusterflick`,
    description:
      "Every film, every cinema, one place. Compare screenings across London and find your perfect movie night.",
  };
}

export default function AboutPage() {
  return <AboutContent />;
}
