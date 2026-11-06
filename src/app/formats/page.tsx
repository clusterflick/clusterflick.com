import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getFormatImagePath } from "@/utils/get-format-image";
import { getFormatsIndex } from "@/utils/get-formats-index";
import FormatsPageContent from "./page-content";
import { VENUE_COUNT } from "@/utils/venue-count";

export const metadata: Metadata = {
  title: "Browse Films by Format in London",
  description: `Browse London cinema listings by format: 70mm, 35mm, 16mm, IMAX, 3D and more. Find film prints and premium presentations showing across ${VENUE_COUNT} London venues.`,
  alternates: {
    canonical: "/formats",
  },
  openGraph: {
    title: "Browse Films by Format in London | Clusterflick",
    description:
      "Browse London cinema listings by format: 70mm, 35mm, 16mm, IMAX, 3D and more.",
    url: "https://clusterflick.com/formats",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "Browse Films by Format in London | Clusterflick",
    description:
      "Browse London cinema listings by format: 70mm, 35mm, 16mm, IMAX, 3D and more.",
    creator: "@clusterflick",
  },
};

export default async function FormatsPage() {
  const data = await getStaticData();

  const { formats, sections, emptyFormats } = getFormatsIndex(
    data.movies,
    data.venues,
    {
      now: new Date(data.generatedAt).getTime(),
      getImagePath: getFormatImagePath,
    },
  );

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Browse Films by Format in London",
      description:
        "Browse London cinema listings by format. Find film prints and premium presentations showing across London's cinemas.",
      url: "https://clusterflick.com/formats",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: formats.length,
        itemListElement: formats.map((format, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `https://clusterflick.com${format.href}`,
          name: `${format.name} Films`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://clusterflick.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Formats",
          item: "https://clusterflick.com/formats",
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FormatsPageContent
        formats={formats}
        sections={sections}
        emptyFormats={emptyFormats}
      />
    </>
  );
}
