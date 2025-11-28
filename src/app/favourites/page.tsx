import type { Metadata } from "next";
import FavouritesContent from "./content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Favourite movies on Clusterflick`,
    description:
      "Every film, every cinema, one place. Compare screenings across London and find your perfect movie night.",
  };
}

export default function FavouritesPage() {
  return <FavouritesContent />;
}
