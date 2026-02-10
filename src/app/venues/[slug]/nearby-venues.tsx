"use client";
import { useState } from "react";
import Link from "next/link";
import type { NearbyVenue } from "./page-content";
import styles from "./page.module.css";

const INITIAL_COUNT = 5;

export default function NearbyVenues({ venues }: { venues: NearbyVenue[] }) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = venues.length > INITIAL_COUNT;

  return (
    <>
      <ul className={styles.nearbyList}>
        {venues.map(({ venue: nearby, distance, url }, index) => (
          <li
            key={nearby.id}
            className={styles.nearbyItem}
            hidden={!showAll && index >= INITIAL_COUNT}
          >
            <Link href={url} className={styles.nearbyLink}>
              {nearby.name}
            </Link>
            <span className={styles.nearbyDistance}>
              {distance < 0.1 ? "< 0.1 miles" : `${distance.toFixed(1)} miles`}
            </span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          className={styles.nearbyToggle}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show fewer" : `Show all ${venues.length} nearby venues`}
        </button>
      )}
    </>
  );
}
