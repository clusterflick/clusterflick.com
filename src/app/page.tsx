import type { Metadata } from "next";
import type { CinemaData } from "@/types";
import { type Compressed, decompress } from "compress-json";
import HomePageContent from "./content";

export async function generateMetadata(): Promise<Metadata> {
  const compressedData = await import("../../public/combined-data.json", {
    with: { type: "json" },
  });
  const data = decompress(compressedData.default as Compressed) as CinemaData;
  return {
    title: `London Cinema Movies - ${Object.keys(data.movies).length} to pick from!`,
  };
}

export default function HomePage() {
  return <HomePageContent />;
}
