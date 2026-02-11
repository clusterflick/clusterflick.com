import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { groupVenuesByBorough } from "@/utils/get-borough-venues";
import { getBoroughUrl } from "@/utils/get-borough-url";
import LondonCinemasPageContent from "./page-content";

export const metadata: Metadata = {
  title: "London Cinemas — Browse Cinemas Across Every Borough",
  description:
    "Discover cinemas across London, borough by borough. From independent arthouse venues and repertory cinemas to major multiplex chains — find screening venues near you, compare what's on, and book tickets.",
  alternates: {
    canonical: "/london-cinemas",
  },
  openGraph: {
    title:
      "London Cinemas — Browse Cinemas Across Every Borough | Clusterflick",
    description:
      "Discover cinemas across London, borough by borough. Independent arthouse venues, repertory cinemas and major chains — find what's showing near you.",
    url: "https://clusterflick.com/london-cinemas",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title:
      "London Cinemas — Browse Cinemas Across Every Borough | Clusterflick",
    description:
      "Discover cinemas across London, borough by borough. Independent arthouse venues, repertory cinemas and major chains — find what's showing near you.",
    creator: "@clusterflick",
  },
};

export type BoroughListItem = {
  name: string;
  slug: string;
  href: string;
  venueCount: number;
};

export default async function LondonCinemasPage() {
  const data = await getStaticData();
  const venuesByBorough = groupVenuesByBorough(data.venues);

  const boroughs: BoroughListItem[] = LONDON_BOROUGHS.filter((b) =>
    venuesByBorough.has(b.slug),
  )
    .map((b) => ({
      name: b.name,
      slug: b.slug,
      href: getBoroughUrl(b),
      venueCount: venuesByBorough.get(b.slug)!.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalBoroughs = boroughs.length;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "London Cinemas",
    description:
      "Cinemas and screening venues across London boroughs, from independent arthouse cinemas to major multiplex chains.",
    numberOfItems: boroughs.length,
    itemListElement: boroughs.map((borough, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "City",
        name: borough.name,
        url: `https://clusterflick.com${borough.href}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LondonCinemasPageContent
        boroughs={boroughs}
        totalBoroughs={totalBoroughs}
      />
    </>
  );
}
