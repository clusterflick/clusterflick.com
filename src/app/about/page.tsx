import type { Metadata } from "next";
import AboutContent from "./content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `London Cinema Movies - About`,
  };
}

export default function AboutPage() {
  return <AboutContent />;
}
