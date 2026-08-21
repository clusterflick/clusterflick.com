"use client";

import Link from "next/link";
import type { CollectionSummary } from "@/types";
import { getCollectionUrl } from "@/utils/get-collection-url";
import PillList from "@/components/pill-list";
import styles from "./collection-section.module.css";

interface CollectionSectionProps {
  collections: CollectionSummary[];
}

/**
 * The collections this listing belongs to. A film is in at most one; a
 * marathon or double bill takes its collections from the films it screens, so
 * it can name several — see `getMovieCollections`.
 */
export default function CollectionSection({
  collections,
}: CollectionSectionProps) {
  if (collections.length === 0) return null;

  return (
    <div className={styles.section}>
      <PillList
        title="Part of"
        itemNoun="collections"
        items={collections}
        maxVisible={3}
        renderItem={(item) => (
          <>
            <Link href={getCollectionUrl(item)}>{item.name}</Link>
            {/* Outside the link: the collection is called "The Lord of the
                Rings", not "The Lord of the Rings collection", and the link
                text should be the name it actually goes by. */}
            <span className={styles.noun}>collection</span>
            <span className={styles.count}>{item.partCount} films</span>
          </>
        )}
      />
    </div>
  );
}
