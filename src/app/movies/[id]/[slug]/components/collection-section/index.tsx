"use client";

import Link from "next/link";
import type { CollectionSummary } from "@/types";
import { getCollectionUrl } from "@/utils/get-collection-url";
import PillList from "@/components/pill-list";
import styles from "./collection-section.module.css";

interface CollectionSectionProps {
  collection?: CollectionSummary;
}

/**
 * The collection this film belongs to. A film is in at most one, so this is a
 * single pill — the list shape keeps it consistent with the "Appears on" lists
 * directly above it.
 */
export default function CollectionSection({
  collection,
}: CollectionSectionProps) {
  if (!collection) return null;

  return (
    <div className={styles.section}>
      <PillList
        title="Part of"
        itemNoun="collections"
        items={[collection]}
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
