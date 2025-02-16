import type { Metadata } from "next";
import FavouritesContent from "./content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `London Cinema Movies - Favourites`,
  };
}

export default function FavouritesPage() {
  return <FavouritesContent />;
}
