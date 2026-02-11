"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import type { VenueGroupData } from "./page";
import { normalizeForSearch } from "@/lib/filters/normalize";
import styles from "./page.module.css";

interface VenueListProps {
  groups: VenueGroupData[];
}

export default function VenueList({ groups }: VenueListProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;

    const q = normalizeForSearch(query);
    return groups
      .map((group) => ({
        ...group,
        venues: group.venues.filter((v) =>
          normalizeForSearch(v.name).includes(q),
        ),
      }))
      .filter((group) => group.venues.length > 0);
  }, [groups, query]);

  const matchCount = filteredGroups.reduce(
    (sum, g) => sum + g.venues.length,
    0,
  );

  return (
    <>
      <div className={styles.searchWrapper}>
        <svg
          className={styles.searchIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path
            d="m21 21-4.35-4.35"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Filter venues..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear filter"
          >
            &times;
          </button>
        )}
      </div>

      {query.trim() && (
        <p className={styles.searchResultCount}>
          Showing {matchCount} {matchCount === 1 ? "venue" : "venues"}
        </p>
      )}

      {filteredGroups.map((group) => (
        <section key={group.id} className={styles.group}>
          <h2 className={styles.groupTitle}>
            {group.label}
            <span className={styles.groupCount}>{group.venues.length}</span>
          </h2>
          <ul className={styles.venueList}>
            {group.venues.map((venue) => (
              <li key={venue.href}>
                <Link href={venue.href} className={styles.venueLink}>
                  <span className={styles.venueName}>{venue.displayName}</span>
                  {venue.eventCount > 0 && (
                    <span className={styles.venueEventCount}>
                      {venue.eventCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {filteredGroups.length === 0 && (
        <p className={styles.noResults}>
          No venues match &ldquo;{query}&rdquo;
        </p>
      )}
    </>
  );
}
