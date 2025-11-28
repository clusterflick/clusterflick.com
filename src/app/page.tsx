import type { Metadata } from "next";
import HomePageContent from "./content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Clusterflick`,
    description:
      "Every film, every cinema, one place. Compare screenings across London and find your perfect movie night.",
  };
}

export default function HomePage() {
  return <HomePageContent />;
}
