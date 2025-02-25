import type { Metadata } from "next";
import getData from "@/utils/get-data";
import HomePageContent from "./content";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  return {
    title: `London Cinema Movies - ${Object.keys(data.movies).length} to pick from!`,
  };
}

export default function HomePage() {
  return <HomePageContent />;
}
