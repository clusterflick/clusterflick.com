import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getCollectionsData } from "@/utils/get-collections-data";
import { getCollectionUrl } from "@/utils/get-collection-url";
import { getCollectionScreenings } from "@/utils/get-collection-movies";
import type { CollectionCardItem } from "@/components/collection-card";
import CollectionsPageContent from "./page-content";

const DESCRIPTION =
  "Browse film collections — Harry Potter, Star Wars, The Godfather, Scream — with two or more instalments screening in London cinemas right now.";

export const metadata: Metadata = {
  title: "Film Collections",
  description: DESCRIPTION,
  alternates: {
    canonical: "/collections",
  },
  openGraph: {
    title: "Film Collections | Clusterflick",
    description: DESCRIPTION,
    url: "https://clusterflick.com/collections",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "Film Collections | Clusterflick",
    description: DESCRIPTION,
    creator: "@clusterflick",
  },
};

export default async function CollectionsPage() {
  const data = await getStaticData();
  const nowTs = new Date(data.generatedAt).getTime();
  const collections = getCollectionsData();

  const items: CollectionCardItem[] = Object.values(collections)
    .map((collection) => {
      const { showing, entries } = getCollectionScreenings(
        collection,
        data.movies,
        nowTs,
      );
      return {
        id: collection.id,
        name: collection.name,
        href: getCollectionUrl(collection),
        posterPath: collection.posterPath,
        showingCount: showing.length,
        partCount: entries.length,
      };
    })
    // Alphabetical: every collection here has at least two films showing, so
    // ranking by how many wouldn't separate them into "showing" and "not" the
    // way the film-lists index does — it would just make a named franchise
    // harder to find.
    .sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Film Collections",
    description: DESCRIPTION,
    numberOfItems: items.length,
    itemListElement: items.map((collection, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CollectionPage",
        name: collection.name,
        url: `https://clusterflick.com${collection.href}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionsPageContent collections={items} />
    </>
  );
}
