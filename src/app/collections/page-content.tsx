import StandardPageLayout from "@/components/standard-page-layout";
import CollectionCard, {
  type CollectionCardItem,
} from "@/components/collection-card";
import styles from "./page.module.css";

interface CollectionsPageContentProps {
  collections: CollectionCardItem[];
}

export default function CollectionsPageContent({
  collections,
}: CollectionsPageContentProps) {
  const subtitle = `${collections.length} ${
    collections.length === 1 ? "collection" : "collections"
  }`;

  return (
    <StandardPageLayout title="Film Collections" subtitle={subtitle}>
      <p className={styles.intro}>
        Franchises, trilogies and long-running series with two or more films
        screening in London right now. Each page shows the whole run, so you can
        see what you can catch on the big screen and what you have already
        missed.
      </p>

      <ul className={styles.collectionGrid}>
        {collections.map((collection) => (
          <li key={collection.id}>
            <CollectionCard {...collection} />
          </li>
        ))}
      </ul>
    </StandardPageLayout>
  );
}
